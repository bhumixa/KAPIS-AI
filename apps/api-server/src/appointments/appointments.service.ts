import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Appointment, Doctor, Patient } from '@prisma/client';
import {
  dateToIsoDate,
  dateToTimeString,
  isoDateToDate,
  timeStringToDate,
} from '../common/utils/date-time.util';
import { DoctorsRepository } from '../doctors/doctors.repository';
import { PatientsRepository } from '../patients/patients.repository';
import { ScheduleService } from '../schedule/schedule.service';
import { doTimeRangesOverlap } from './appointment-time.util';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentDto } from './dto/appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const REBOOKING_FIELDS = ['patientId', 'doctorId', 'date', 'startTime', 'endTime'] as const;

/**
 * Owns every booking rule the Angular AppointmentService used to enforce
 * client-side (see docs/DevelopmentGuide.md's "The Appointment Engine" notes):
 * doctor/patient exist and are active, the doctor is working that day
 * (schedule + leave + holidays via ScheduleService.isDoctorAvailableOn(),
 * itself mirroring AvailabilityService.isDoctorAvailableOn()), no overlap with
 * the doctor's other non-cancelled appointments, and durationMinutes is always
 * snapshotted server-side rather than trusted from the client.
 */
@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly doctorsRepository: DoctorsRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly scheduleService: ScheduleService,
  ) {}

  async findAll(): Promise<AppointmentDto[]> {
    const appointments = await this.appointmentsRepository.findAll();
    return appointments.map(toAppointmentDto);
  }

  // Added in Sprint 16 for ConversationContextService - reuses
  // AppointmentsRepository.findByPatientId() and the same DTO mapping every
  // other method here already uses.
  async findByPatientId(patientId: string): Promise<AppointmentDto[]> {
    const appointments = await this.appointmentsRepository.findByPatientId(patientId);
    return appointments.map(toAppointmentDto);
  }

  async findOne(id: string): Promise<AppointmentDto> {
    const appointment = await this.appointmentsRepository.findById(id);
    if (!appointment) {
      throw new NotFoundException(`Appointment "${id}" was not found.`);
    }
    return toAppointmentDto(appointment);
  }

  async create(input: CreateAppointmentDto): Promise<AppointmentDto> {
    const doctor = await this.requireActiveDoctor(input.doctorId);
    await this.requireActivePatient(input.patientId);
    await this.assertDoctorAvailable(input.doctorId, input.date);
    await this.assertNoOverlap(input.doctorId, input.date, input.startTime, input.endTime);

    const appointment = await this.appointmentsRepository.create({
      patientId: input.patientId,
      doctorId: input.doctorId,
      appointmentDate: isoDateToDate(input.date),
      startTime: timeStringToDate(input.startTime),
      endTime: timeStringToDate(input.endTime),
      durationMinutes: doctor.consultationDuration,
      appointmentType: input.type,
      status: 'scheduled',
      notes: input.notes,
    });

    return toAppointmentDto(appointment);
  }

  async update(id: string, input: UpdateAppointmentDto): Promise<AppointmentDto> {
    const existing = await this.appointmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Appointment "${id}" was not found.`);
    }

    const isRebooking = REBOOKING_FIELDS.some((field) => input[field] !== undefined);

    const patientId = input.patientId ?? existing.patientId;
    const doctorId = input.doctorId ?? existing.doctorId;
    const date = input.date ?? dateToIsoDate(existing.appointmentDate);
    const startTime = input.startTime ?? dateToTimeString(existing.startTime);
    const endTime = input.endTime ?? dateToTimeString(existing.endTime);

    let durationMinutes = existing.durationMinutes;

    // Status-only changes (cancel/complete) skip re-validation entirely - see
    // UpdateAppointmentDto's doc comment for why that mirrors the old mock.
    if (isRebooking) {
      const doctor = await this.requireActiveDoctor(doctorId);
      await this.requireActivePatient(patientId);
      await this.assertDoctorAvailable(doctorId, date);
      await this.assertNoOverlap(doctorId, date, startTime, endTime, id);
      durationMinutes = doctor.consultationDuration;
    }

    const appointment = await this.appointmentsRepository.update(id, {
      ...(input.patientId ? { patientId: input.patientId } : {}),
      ...(input.doctorId ? { doctorId: input.doctorId } : {}),
      ...(input.date ? { appointmentDate: isoDateToDate(input.date) } : {}),
      ...(input.startTime ? { startTime: timeStringToDate(input.startTime) } : {}),
      ...(input.endTime ? { endTime: timeStringToDate(input.endTime) } : {}),
      ...(isRebooking ? { durationMinutes } : {}),
      ...(input.type ? { appointmentType: input.type } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    return toAppointmentDto(appointment);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.appointmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Appointment "${id}" was not found.`);
    }
    await this.appointmentsRepository.delete(id);
  }

  private async requireActiveDoctor(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundException(`Doctor "${doctorId}" was not found.`);
    }
    if (doctor.status !== 'active') {
      throw new BadRequestException('Doctor is not active.');
    }
    return doctor;
  }

  private async requireActivePatient(patientId: string): Promise<Patient> {
    const patient = await this.patientsRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundException(`Patient "${patientId}" was not found.`);
    }
    if (patient.status !== 'active') {
      throw new BadRequestException('Patient is not active.');
    }
    return patient;
  }

  private async assertDoctorAvailable(doctorId: string, isoDate: string): Promise<void> {
    const available = await this.scheduleService.isDoctorAvailableOn(doctorId, isoDate);
    if (!available) {
      throw new BadRequestException('Doctor is not available on the selected date.');
    }
  }

  private async assertNoOverlap(
    doctorId: string,
    isoDate: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<void> {
    const candidates = await this.appointmentsRepository.findActiveForDoctorOnDate(
      doctorId,
      isoDate,
      excludeId,
    );
    const overlaps = candidates.some((appointment) =>
      doTimeRangesOverlap(
        startTime,
        endTime,
        dateToTimeString(appointment.startTime),
        dateToTimeString(appointment.endTime),
      ),
    );
    if (overlaps) {
      throw new ConflictException('This time slot overlaps with an existing appointment.');
    }
  }
}

export function toAppointmentDto(appointment: Appointment): AppointmentDto {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: dateToIsoDate(appointment.appointmentDate),
    startTime: dateToTimeString(appointment.startTime),
    endTime: dateToTimeString(appointment.endTime),
    durationMinutes: appointment.durationMinutes,
    type: appointment.appointmentType as AppointmentDto['type'],
    status: appointment.status as AppointmentDto['status'],
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}
