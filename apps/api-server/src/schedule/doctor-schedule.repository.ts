import { Injectable } from '@nestjs/common';
import { DoctorSchedule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DayOfWeek } from './dto/day-schedule.dto';

export interface DayScheduleWrite {
  dayOfWeek: DayOfWeek;
  isWorking: boolean;
  morningStart: Date;
  morningEnd: Date;
  afternoonStart: Date;
  afternoonEnd: Date;
}

@Injectable()
export class DoctorScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByDoctorId(doctorId: string): Promise<DoctorSchedule[]> {
    return this.prisma.doctorSchedule.findMany({ where: { doctorId } });
  }

  // The weekly editor always submits all 7 days at once (see
  // apps/clinic-admin's WeeklyScheduleEditor.submit()) - one upsert per day
  // inside a transaction keeps that "whole week, one save" semantic atomic.
  async replaceWeek(doctorId: string, days: DayScheduleWrite[]): Promise<DoctorSchedule[]> {
    return this.prisma.$transaction(
      days.map((day) =>
        this.prisma.doctorSchedule.upsert({
          where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: day.dayOfWeek } },
          create: { doctorId, ...day },
          update: { ...day },
        }),
      ),
    );
  }
}
