import { Injectable } from '@nestjs/common';
import { ClinicHoliday, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicHolidayRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ClinicHoliday[]> {
    return this.prisma.clinicHoliday.findMany({ orderBy: { holidayDate: 'asc' } });
  }

  findById(id: string): Promise<ClinicHoliday | null> {
    return this.prisma.clinicHoliday.findUnique({ where: { id } });
  }

  create(data: Prisma.ClinicHolidayCreateInput): Promise<ClinicHoliday> {
    return this.prisma.clinicHoliday.create({ data });
  }

  update(id: string, data: Prisma.ClinicHolidayUpdateInput): Promise<ClinicHoliday> {
    return this.prisma.clinicHoliday.update({ where: { id }, data });
  }

  delete(id: string): Promise<ClinicHoliday> {
    return this.prisma.clinicHoliday.delete({ where: { id } });
  }
}
