import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentDto } from '../appointments/dto/appointment.dto';
import { AppointmentsService } from '../appointments/appointments.service';
import { dateToIsoDate } from '../common/utils/date-time.util';
import { DoctorDto } from '../doctors/dto/doctor.dto';
import { DoctorsService } from '../doctors/doctors.service';
import { PatientsService } from '../patients/patients.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationService } from './conversation.service';
import {
  ClinicProfileContextDto,
  ConversationContextDto,
  KnowledgeBaseContextDto,
} from './dto/conversation-context.dto';

// Assembles the single read-only object requirement 3 (Sprint 16 brief) asks
// for - everything a future AI reply-drafting feature will need about one
// conversation - by composing services/tables that already exist rather than
// inventing new ones: PatientsService/DoctorsService/AppointmentsService (all
// exported in this sprint specifically for this reuse - see their modules'
// doc comments) for patient/doctor/appointment history, and direct
// PrismaService reads for clinic.clinics and the Sprint 7 knowledge-base
// tables (013/014/016/018), none of which have their own NestJS module yet -
// Sprint 16 only needed read access, not full CRUD, so no ClinicsModule/
// KnowledgeBaseModule was built to get it. Nothing here is persisted or sent
// anywhere; it's recomputed on every call.
@Injectable()
export class ConversationContextService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  async getContext(conversationId: string): Promise<ConversationContextDto> {
    const conversation = await this.conversationService.findOne(conversationId);
    const patient = await this.patientsService.findOne(conversation.patientId);
    const appointments = await this.appointmentsService.findByPatientId(patient.id);

    const today = dateToIsoDate(new Date());
    const upcomingAppointments = appointments
      .filter((appointment) => appointment.status === 'scheduled' && appointment.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    const previousAppointments = appointments.filter(
      (appointment) => !(appointment.status === 'scheduled' && appointment.date >= today),
    );

    const doctor = await this.resolveDoctor(upcomingAppointments, previousAppointments);
    const clinicProfile = await this.getClinicProfile();
    const knowledgeBase = await this.getKnowledgeBase();

    return {
      conversation,
      patient,
      doctor,
      upcomingAppointments,
      previousAppointments,
      clinicProfile,
      knowledgeBase,
    };
  }

  // The doctor "assigned" to a conversation isn't a stored field - it's
  // inferred from the patient's most relevant appointment (soonest upcoming,
  // else most recent past), the exact same derivation apps/clinic-admin's
  // Conversation Details page already does client-side
  // (appointmentSummary/appointmentDoctor computed()s).
  private async resolveDoctor(
    upcoming: AppointmentDto[],
    previous: AppointmentDto[],
  ): Promise<DoctorDto | null> {
    const relevant = upcoming[0] ?? previous[0];
    if (!relevant) {
      return null;
    }
    try {
      return await this.doctorsService.findOne(relevant.doctorId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }

  // Single-clinic deployment (see docs/Architecture.md) - there is exactly one
  // clinic.clinics row, so no clinicId lookup parameter is needed.
  private async getClinicProfile(): Promise<ClinicProfileContextDto | null> {
    const clinic = await this.prisma.clinic.findFirst();
    if (!clinic) {
      return null;
    }
    return {
      clinicName: clinic.clinicName,
      address: clinic.address,
      city: clinic.city,
      state: clinic.state,
      country: clinic.country,
      postalCode: clinic.postalCode,
      phone: clinic.phone,
      email: clinic.email,
      timeZone: clinic.timeZone,
      businessHours: Array.isArray(clinic.businessHours) ? (clinic.businessHours as never) : [],
    };
  }

  private async getKnowledgeBase(): Promise<KnowledgeBaseContextDto> {
    const [faqs, services, policies, messageTemplates] = await Promise.all([
      this.prisma.faq.findMany({ where: { status: 'published' }, orderBy: { category: 'asc' } }),
      this.prisma.clinicService.findMany({
        where: { status: 'active' },
        orderBy: { name: 'asc' },
      }),
      this.prisma.policy.findMany({ where: { status: 'active' }, orderBy: { title: 'asc' } }),
      this.prisma.messageTemplate.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return {
      faqs: faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
      })),
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        category: service.category,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price.toNumber(),
      })),
      policies: policies.map((policy) => ({
        id: policy.id,
        title: policy.title,
        type: policy.type,
        content: policy.content,
      })),
      messageTemplates: messageTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        type: template.type,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
      })),
    };
  }
}
