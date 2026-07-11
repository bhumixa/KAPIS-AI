import { Injectable } from '@nestjs/common';
import { Patient, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Thin Prisma wrapper - keeps PatientsService free of query-building details,
// same shape as DoctorsRepository.
@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Patient[]> {
    return this.prisma.patient.findMany({ orderBy: { lastName: 'asc' } });
  }

  findById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  // Sprint 20 (WhatsApp Cloud API) - resolves an inbound webhook's `from` number
  // to a patient, the same lookup ConversationsModule would otherwise have to
  // duplicate. Not unique in the schema (two patients could share a household
  // number), so this returns the first match rather than assuming uniqueness.
  findByWhatsappNumber(whatsappNumber: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({ where: { whatsappNumber } });
  }

  create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return this.prisma.patient.create({ data });
  }

  update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient> {
    return this.prisma.patient.update({ where: { id }, data });
  }

  delete(id: string): Promise<Patient> {
    return this.prisma.patient.delete({ where: { id } });
  }
}
