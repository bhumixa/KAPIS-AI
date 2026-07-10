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
