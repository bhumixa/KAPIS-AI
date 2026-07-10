import { Injectable } from '@nestjs/common';
import { DoctorLeave, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorLeaveRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<DoctorLeave[]> {
    return this.prisma.doctorLeave.findMany({ orderBy: { startDate: 'desc' } });
  }

  findByDoctorId(doctorId: string): Promise<DoctorLeave[]> {
    return this.prisma.doctorLeave.findMany({ where: { doctorId } });
  }

  findById(id: string): Promise<DoctorLeave | null> {
    return this.prisma.doctorLeave.findUnique({ where: { id } });
  }

  create(data: Prisma.DoctorLeaveCreateInput): Promise<DoctorLeave> {
    return this.prisma.doctorLeave.create({ data });
  }

  update(id: string, data: Prisma.DoctorLeaveUpdateInput): Promise<DoctorLeave> {
    return this.prisma.doctorLeave.update({ where: { id }, data });
  }

  delete(id: string): Promise<DoctorLeave> {
    return this.prisma.doctorLeave.delete({ where: { id } });
  }
}
