import { Injectable } from '@nestjs/common';
import { Appointment, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isoDateToDate } from '../common/utils/date-time.util';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'asc' }],
    });
  }

  findById(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({ where: { id } });
  }

  // Overlap pre-check: every non-cancelled appointment for this doctor on this
  // date, so AppointmentsService can compare time ranges in JS the same way
  // apps/clinic-admin's doTimeRangesOverlap() did - the DB's GiST exclusion
  // constraint (007_create_appointments.sql) still backs this up against races.
  findActiveForDoctorOnDate(
    doctorId: string,
    isoDate: string,
    excludeId?: string,
  ): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: isoDateToDate(isoDate),
        status: { not: 'cancelled' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  // Added in Sprint 16 for ConversationContextService's upcoming/previous
  // appointments read - every other query on this repository filters by
  // doctor, so this is the first by-patient lookup.
  findByPatientId(patientId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'asc' }],
    });
  }

  create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
    return this.prisma.appointment.create({ data });
  }

  update(id: string, data: Prisma.AppointmentUpdateInput): Promise<Appointment> {
    return this.prisma.appointment.update({ where: { id }, data });
  }

  delete(id: string): Promise<Appointment> {
    return this.prisma.appointment.delete({ where: { id } });
  }
}
