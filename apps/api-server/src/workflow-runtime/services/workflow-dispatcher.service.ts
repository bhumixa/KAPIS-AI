import { Injectable, Logger } from '@nestjs/common';
import { AiCollectedFields, EMPTY_COLLECTED_FIELDS } from '../../ai/dto/ai-intent.dto';
import { AiExecutionResultDto } from '../../ai/dto/ai-execution.dto';
import { AppConfig } from '../../config/configuration';
import { ConfigService } from '@nestjs/config';
import { AppointmentDto } from '../../appointments/dto/appointment.dto';
import { AppointmentsService } from '../../appointments/appointments.service';
import { ConversationService } from '../../conversations/conversation.service';
import { DoctorDto } from '../../doctors/dto/doctor.dto';
import { DoctorsService } from '../../doctors/doctors.service';
import { InquiriesService } from '../../inquiries/inquiries.service';
import { WorkflowExecutionDto } from '../../n8n/dto/workflow-execution.dto';
import { N8nService } from '../../n8n/n8n.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { WorkflowDecision } from '../enums/workflow-decision.enum';
import { WorkflowStep, WorkflowStepStatus } from '../enums/workflow-step.enum';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowRetryService } from './workflow-retry.service';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Sprint 25 - AI intent must clear this bar before WorkflowDispatcherService
// acts on it: requiresFollowUp means the AI itself isn't done asking
// questions yet, and a very low confidence score means it isn't sure what
// the sender actually wants. Both fall back to AUTO_REPLY instead (the AI's
// own follow-up question gets sent) rather than risk booking/cancelling on a
// shaky read of the conversation.
const MIN_ACTIONABLE_CONFIDENCE = 0.3;

const BOOKING_REQUIRED_FIELDS: (keyof AiCollectedFields)[] = ['doctorName', 'date', 'time', 'reason'];
const RESCHEDULE_REQUIRED_FIELDS: (keyof AiCollectedFields)[] = ['newDate', 'newTime'];

/**
 * Decides what an AI-drafted reply means for the conversation and carries the
 * decision out: triggers the real n8n workflow (reusing N8nService, Sprint
 * 15) and acts on the conversation via WhatsappService (Sprint 20, send) /
 * ConversationService (Sprint 16, status) / AppointmentsService (Sprint 13,
 * book/reschedule/cancel) / InquiriesService (Sprint 25, Inquiry->Patient).
 * Never talks to Prisma directly - all persistence goes back through
 * WorkflowExecutionService or the domain services above.
 *
 * Sprint 21 originally derived the decision from a small keyword heuristic
 * over the AI's plain-text reply (HANDOFF_PHRASES). Sprint 25 replaces that
 * entirely: the AI now returns a structured intent (see ai/dto/ai-intent.dto.ts)
 * and decide() maps it directly to a WorkflowDecision - no string matching.
 */
@Injectable()
export class WorkflowDispatcherService {
  private readonly logger = new Logger(WorkflowDispatcherService.name);
  private readonly n8nWorkflowId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly n8nService: N8nService,
    private readonly whatsappService: WhatsappService,
    private readonly conversationService: ConversationService,
    private readonly appointmentsService: AppointmentsService,
    private readonly doctorsService: DoctorsService,
    private readonly inquiriesService: InquiriesService,
    private readonly retryService: WorkflowRetryService,
    private readonly executionService: WorkflowExecutionService,
  ) {
    const config = this.configService.get<AppConfig['workflowRuntime']>('app.workflowRuntime')!;
    this.n8nWorkflowId = config.n8nWorkflowId;
  }

  decide(aiResult: AiExecutionResultDto): WorkflowDecision {
    if (!aiResult.response.trim()) {
      return WorkflowDecision.NO_ACTION;
    }

    switch (aiResult.intent) {
      case 'HANDOFF':
        return WorkflowDecision.HANDOFF;
      case 'EMERGENCY':
        // Never gated on confidence/collectedFields - an emergency reply
        // always goes out, even if the AI is unsure of the details.
        return WorkflowDecision.EMERGENCY;
      case 'BOOK_APPOINTMENT':
        return this.isActionable(aiResult) && this.hasFields(aiResult.collectedFields, BOOKING_REQUIRED_FIELDS)
          ? WorkflowDecision.BOOK_APPOINTMENT
          : WorkflowDecision.AUTO_REPLY;
      case 'RESCHEDULE_APPOINTMENT':
        return this.isActionable(aiResult) &&
          this.hasFields(aiResult.collectedFields, RESCHEDULE_REQUIRED_FIELDS)
          ? WorkflowDecision.RESCHEDULE_APPOINTMENT
          : WorkflowDecision.AUTO_REPLY;
      case 'CANCEL_APPOINTMENT':
        return this.isActionable(aiResult) && aiResult.collectedFields.cancelConfirmed === 'true'
          ? WorkflowDecision.CANCEL_APPOINTMENT
          : WorkflowDecision.AUTO_REPLY;
      case 'GENERAL_INQUIRY':
      default:
        return WorkflowDecision.AUTO_REPLY;
    }
  }

  private isActionable(aiResult: AiExecutionResultDto): boolean {
    return !aiResult.requiresFollowUp && aiResult.confidence >= MIN_ACTIONABLE_CONFIDENCE;
  }

  private hasFields(fields: AiCollectedFields, required: (keyof AiCollectedFields)[]): boolean {
    return required.every((key) => Boolean(fields[key]));
  }

  /** Triggers the registered n8n workflow (default: "conversation-routing") - not called at all for EMERGENCY (see ConversationWorkflowService). */
  async triggerWorkflow(
    workflowRuntimeId: string,
    conversationId: string,
    decision: WorkflowDecision,
    aiResult: AiExecutionResultDto,
  ): Promise<{ execution: WorkflowExecutionDto; latencyMs: number }> {
    const startedAt = Date.now();

    const execution = await this.retryService.run(
      () =>
        this.n8nService.triggerWorkflow(this.n8nWorkflowId, {
          triggeredBy: 'workflow-runtime',
          payload: {
            conversationId,
            decision,
            aiResponsePreview: aiResult.response.slice(0, 200),
          },
        }),
      {
        onRetry: (attempt, error) =>
          this.executionService.recordRetry(workflowRuntimeId, WorkflowStep.N8N_TRIGGERED, attempt, error.message),
      },
    );

    await this.executionService.logStep(
      workflowRuntimeId,
      WorkflowStep.N8N_TRIGGERED,
      execution.status === 'success' ? WorkflowStepStatus.SUCCESS : WorkflowStepStatus.FAILED,
      execution.status === 'success' ? 'n8n workflow triggered.' : (execution.errorMessage ?? 'n8n workflow trigger failed.'),
      { n8nExecutionId: execution.id },
    );

    return { execution, latencyMs: Date.now() - startedAt };
  }

  /** Carries out the decision. */
  async dispatch(
    workflowRuntimeId: string,
    conversationId: string,
    decision: WorkflowDecision,
    aiResult: AiExecutionResultDto,
  ): Promise<void> {
    switch (decision) {
      case WorkflowDecision.AUTO_REPLY:
        await this.sendReply(workflowRuntimeId, conversationId, aiResult.response);
        break;

      case WorkflowDecision.EMERGENCY:
        await this.sendReply(workflowRuntimeId, conversationId, aiResult.response);
        await this.executionService.logStep(
          workflowRuntimeId,
          WorkflowStep.REPLY_SENT,
          WorkflowStepStatus.SUCCESS,
          'EMERGENCY intent - guidance sent, no booking workflow triggered.',
        );
        break;

      case WorkflowDecision.BOOK_APPOINTMENT:
        await this.handleBookAppointment(workflowRuntimeId, conversationId, aiResult);
        break;

      case WorkflowDecision.RESCHEDULE_APPOINTMENT:
        await this.handleRescheduleAppointment(workflowRuntimeId, conversationId, aiResult);
        break;

      case WorkflowDecision.CANCEL_APPOINTMENT:
        await this.handleCancelAppointment(workflowRuntimeId, conversationId, aiResult);
        break;

      case WorkflowDecision.HANDOFF:
        await this.conversationService.update(conversationId, { status: 'waiting' });
        await this.sendReplyBestEffort(workflowRuntimeId, conversationId, aiResult.response);
        await this.executionService.logStep(
          workflowRuntimeId,
          WorkflowStep.REPLY_SENT,
          WorkflowStepStatus.SUCCESS,
          'Conversation handed off to a human - moved to "waiting".',
        );
        break;

      case WorkflowDecision.CREATE_TASK:
        this.logger.log(`Run ${workflowRuntimeId}: decision CREATE_TASK recorded - no task backend exists yet.`);
        await this.executionService.logStep(
          workflowRuntimeId,
          WorkflowStep.REPLY_SENT,
          WorkflowStepStatus.SUCCESS,
          'Decision recorded as CREATE_TASK - no task backend to dispatch to yet.',
        );
        break;

      case WorkflowDecision.NO_ACTION:
        await this.executionService.logStep(workflowRuntimeId, WorkflowStep.REPLY_SENT, WorkflowStepStatus.SUCCESS, 'No action taken.');
        break;
    }
  }

  // ---- Booking / reschedule / cancel ----

  private async handleBookAppointment(
    workflowRuntimeId: string,
    conversationId: string,
    aiResult: AiExecutionResultDto,
  ): Promise<void> {
    const conversation = await this.conversationService.getOrThrow(conversationId);
    const { date, time, reason, doctorName } = aiResult.collectedFields;

    if (!date || !DATE_PATTERN.test(date) || !time || !TIME_PATTERN.test(time)) {
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        'I didn\'t quite catch a valid date/time for the appointment - could you confirm the date and time you\'d like?',
      );
      return;
    }

    const doctor = await this.resolveDoctorByName(doctorName);
    if (!doctor) {
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        'Could you confirm which doctor you\'d like to see?',
      );
      return;
    }

    // The domain action (patient conversion + appointment creation) is
    // deliberately its own try/catch, separate from sending the confirmation
    // below: a booking that succeeded but whose WhatsApp confirmation failed
    // to send is still a real, persisted booking - it must not be reported
    // back as "I wasn't able to book that slot" (false) or leave
    // collectedFields dirty (the next turn would otherwise re-attempt a
    // booking that already exists).
    try {
      const patientId = conversation.patientId
        ? conversation.patientId
        : await this.resolvePatientFromInquiry(conversationId, conversation.inquiryId);

      const endTime = addMinutesToTime(time, doctor.consultationDuration);
      await this.retryService.run(
        () =>
          this.appointmentsService.create({
            patientId,
            doctorId: doctor.id,
            date,
            startTime: time,
            endTime,
            durationMinutes: doctor.consultationDuration,
            type: 'consultation',
            status: 'scheduled',
            notes: reason ?? '',
          }),
        {
          onRetry: (attempt, error) =>
            this.executionService.recordRetry(workflowRuntimeId, WorkflowStep.REPLY_SENT, attempt, error.message),
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not book the appointment.';
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        `I wasn't able to book that slot (${message}). Could you try a different date or time?`,
      );
      return;
    }

    await this.clearConversationState(conversationId, aiResult);
    await this.sendReplyBestEffort(workflowRuntimeId, conversationId, aiResult.response);
    await this.executionService.logStep(
      workflowRuntimeId,
      WorkflowStep.REPLY_SENT,
      WorkflowStepStatus.SUCCESS,
      `Appointment booked with Dr. ${doctor.firstName} ${doctor.lastName} on ${date} ${time}.`,
    );
  }

  private async handleRescheduleAppointment(
    workflowRuntimeId: string,
    conversationId: string,
    aiResult: AiExecutionResultDto,
  ): Promise<void> {
    const conversation = await this.conversationService.getOrThrow(conversationId);
    const { newDate, newTime } = aiResult.collectedFields;

    if (!newDate || !DATE_PATTERN.test(newDate) || !newTime || !TIME_PATTERN.test(newTime)) {
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        'Could you confirm the new date and time you\'d like?',
      );
      return;
    }

    if (!conversation.patientId) {
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        'I couldn\'t find an existing appointment on file for you to reschedule.',
      );
      return;
    }

    const target = await this.findNearestUpcomingAppointment(conversation.patientId);
    if (!target) {
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        'I couldn\'t find an upcoming appointment on file for you to reschedule.',
      );
      return;
    }

    try {
      const doctor = await this.doctorsService.findOne(target.doctorId);
      const endTime = addMinutesToTime(newTime, doctor.consultationDuration);
      await this.retryService.run(
        () =>
          this.appointmentsService.update(target.id, {
            date: newDate,
            startTime: newTime,
            endTime,
          }),
        {
          onRetry: (attempt, error) =>
            this.executionService.recordRetry(workflowRuntimeId, WorkflowStep.REPLY_SENT, attempt, error.message),
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not reschedule the appointment.';
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        `I wasn't able to move it to that slot (${message}). Could you try a different date or time?`,
      );
      return;
    }

    await this.clearConversationState(conversationId, aiResult);
    await this.sendReplyBestEffort(workflowRuntimeId, conversationId, aiResult.response);
    await this.executionService.logStep(
      workflowRuntimeId,
      WorkflowStep.REPLY_SENT,
      WorkflowStepStatus.SUCCESS,
      `Appointment ${target.id} rescheduled to ${newDate} ${newTime}.`,
    );
  }

  private async handleCancelAppointment(
    workflowRuntimeId: string,
    conversationId: string,
    aiResult: AiExecutionResultDto,
  ): Promise<void> {
    const conversation = await this.conversationService.getOrThrow(conversationId);

    if (!conversation.patientId) {
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        'I couldn\'t find an existing appointment on file for you to cancel.',
      );
      return;
    }

    const target = await this.findNearestUpcomingAppointment(conversation.patientId);
    if (!target) {
      await this.sendClarification(
        workflowRuntimeId,
        conversationId,
        aiResult,
        'I couldn\'t find an upcoming appointment on file to cancel.',
      );
      return;
    }

    try {
      await this.retryService.run(() => this.appointmentsService.update(target.id, { status: 'cancelled' }), {
        onRetry: (attempt, error) =>
          this.executionService.recordRetry(workflowRuntimeId, WorkflowStep.REPLY_SENT, attempt, error.message),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not cancel the appointment.';
      await this.sendClarification(workflowRuntimeId, conversationId, aiResult, `I wasn't able to cancel it (${message}).`);
      return;
    }

    await this.clearConversationState(conversationId, aiResult);
    await this.sendReplyBestEffort(workflowRuntimeId, conversationId, aiResult.response);
    await this.executionService.logStep(
      workflowRuntimeId,
      WorkflowStep.REPLY_SENT,
      WorkflowStepStatus.SUCCESS,
      `Appointment ${target.id} cancelled.`,
    );
  }

  // ---- Shared helpers ----

  private async sendReply(workflowRuntimeId: string, conversationId: string, body: string): Promise<void> {
    await this.retryService.run(
      () =>
        this.whatsappService.sendMessage({
          conversationId,
          type: 'text',
          body,
          sender: 'ai',
          senderName: 'AI Assistant',
        }),
      {
        onRetry: (attempt, error) =>
          this.executionService.recordRetry(workflowRuntimeId, WorkflowStep.REPLY_SENT, attempt, error.message),
      },
    );
    await this.executionService.logStep(workflowRuntimeId, WorkflowStep.REPLY_SENT, WorkflowStepStatus.SUCCESS, 'Reply sent via WhatsApp.');
  }

  // Used only after a booking/reschedule/cancel action has already succeeded
  // and been persisted - a failure here (e.g. WhatsApp API auth/rate-limit)
  // must not be reported to the caller as an action failure, since the
  // action itself is real and already committed. Logged, not thrown.
  private async sendReplyBestEffort(workflowRuntimeId: string, conversationId: string, body: string): Promise<void> {
    try {
      await this.sendReply(workflowRuntimeId, conversationId, body);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error sending the confirmation.';
      this.logger.warn(`Run ${workflowRuntimeId}: action succeeded but the confirmation reply failed to send: ${message}`);
      await this.executionService.logStep(
        workflowRuntimeId,
        WorkflowStep.REPLY_SENT,
        WorkflowStepStatus.FAILED,
        `Action succeeded but confirmation reply failed to send: ${message}`,
      );
    }
  }

  // A clarification reply is sent instead of the AI's own aiResult.response
  // (which assumed the action would succeed) - conversation state was
  // already written by ConversationWorkflowService before dispatch() ran, so
  // leaving it untouched here means the next turn picks up mid-collection
  // rather than starting over.
  private async sendClarification(
    workflowRuntimeId: string,
    conversationId: string,
    aiResult: AiExecutionResultDto,
    message: string,
  ): Promise<void> {
    this.logger.warn(`Run ${workflowRuntimeId}: falling back to a clarification reply for intent "${aiResult.intent}".`);
    await this.sendReply(workflowRuntimeId, conversationId, message);
  }

  private async clearConversationState(conversationId: string, aiResult: AiExecutionResultDto): Promise<void> {
    await this.conversationService.updateAiState(conversationId, {
      lastIntent: aiResult.intent,
      lastIntentConfidence: aiResult.confidence,
      pendingAction: null,
      collectedFields: EMPTY_COLLECTED_FIELDS,
    });
  }

  private async resolvePatientFromInquiry(conversationId: string, inquiryId: string | null): Promise<string> {
    if (!inquiryId) {
      throw new Error(`Conversation "${conversationId}" has neither a patient nor an inquiry to book against.`);
    }
    const patient = await this.inquiriesService.convertToPatient(inquiryId);
    await this.conversationService.linkPatient(conversationId, patient.id);
    return patient.id;
  }

  // Case-insensitive match against "First Last" or last name alone. Returns
  // null (triggering a clarification reply, never a guess) for no match or
  // an ambiguous one - booking the wrong doctor is worse than asking again.
  private async resolveDoctorByName(doctorName: string | null): Promise<DoctorDto | null> {
    if (!doctorName) {
      return null;
    }
    const doctors = await this.doctorsService.findAll();
    const needle = doctorName.trim().toLowerCase().replace(/^dr\.?\s*/, '');
    const matches = doctors.filter((doctor) => {
      const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      return fullName.includes(needle) || doctor.lastName.toLowerCase() === needle;
    });
    return matches.length === 1 ? matches[0] : null;
  }

  private async findNearestUpcomingAppointment(patientId: string): Promise<AppointmentDto | null> {
    const appointments = await this.appointmentsService.findByPatientId(patientId);
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = appointments
      .filter((appointment) => appointment.status === 'scheduled' && appointment.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  }
}

// HH:mm string arithmetic - deliberately not a Date round-trip (no timezone
// to get wrong) since both input and output are wall-clock time strings.
function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = (hours * 60 + mins + minutes + 24 * 60) % (24 * 60);
  const newHours = Math.floor(total / 60);
  const newMins = total % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}
