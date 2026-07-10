import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ClinicHoliday, DoctorLeave, DoctorSchedule } from '@prisma/client';
import {
  dateToIsoDate,
  dateToTimeString,
  isoDateToDate,
  timeStringToDate,
} from '../common/utils/date-time.util';
import { ClinicHolidayRepository } from './clinic-holiday.repository';
import { CreateClinicHolidayDto } from './dto/create-clinic-holiday.dto';
import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { ClinicHolidayDto } from './dto/clinic-holiday.dto';
import { DAYS_OF_WEEK, DayOfWeek, DayScheduleDto } from './dto/day-schedule.dto';
import { DoctorLeaveDto } from './dto/doctor-leave.dto';
import { DoctorScheduleDto } from './dto/doctor-schedule.dto';
import { UpdateClinicHolidayDto } from './dto/update-clinic-holiday.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { DoctorLeaveRepository } from './doctor-leave.repository';
import { DoctorScheduleRepository } from './doctor-schedule.repository';
import { getDayOfWeek, isDateInRange, isSameMonthAndDay } from './schedule-date.util';

const STANDARD_HOURS = {
  morningStart: '09:00',
  morningEnd: '13:00',
  afternoonStart: '14:00',
  afternoonEnd: '18:00',
};
const DEFAULT_OFF_DAYS: readonly DayOfWeek[] = ['saturday', 'sunday'];

function defaultDaySchedule(day: DayOfWeek): DayScheduleDto {
  return { day, isWorking: !DEFAULT_OFF_DAYS.includes(day), ...STANDARD_HOURS };
}

@Injectable()
export class ScheduleService {
  constructor(
    private readonly scheduleRepository: DoctorScheduleRepository,
    private readonly leaveRepository: DoctorLeaveRepository,
    private readonly holidayRepository: ClinicHolidayRepository,
  ) {}

  // ---- Doctor Schedule ----------------------------------------------------

  async getSchedule(doctorId: string): Promise<DoctorScheduleDto> {
    const rows = await this.scheduleRepository.findByDoctorId(doctorId);
    const byDay = new Map(rows.map((row) => [row.dayOfWeek as DayOfWeek, row]));

    const days = DAYS_OF_WEEK.map((day) => {
      const row = byDay.get(day);
      return row ? toDayScheduleDto(row) : defaultDaySchedule(day);
    });

    const updatedAt = rows.length
      ? new Date(Math.max(...rows.map((row) => row.updatedAt.getTime()))).toISOString()
      : new Date().toISOString();

    return { doctorId, days, updatedAt };
  }

  async updateSchedule(
    doctorId: string,
    input: UpdateDoctorScheduleDto,
  ): Promise<DoctorScheduleDto> {
    const daysPresent = new Set(input.days.map((day) => day.day));
    if (daysPresent.size !== 7 || DAYS_OF_WEEK.some((day) => !daysPresent.has(day))) {
      throw new BadRequestException(
        'Schedule must include exactly one entry for every day of the week.',
      );
    }

    for (const day of input.days) {
      if (day.morningStart >= day.morningEnd) {
        throw new BadRequestException(`${day.day}: morning start must be before morning end.`);
      }
      if (day.afternoonStart >= day.afternoonEnd) {
        throw new BadRequestException(`${day.day}: afternoon start must be before afternoon end.`);
      }
    }

    const rows = await this.scheduleRepository.replaceWeek(
      doctorId,
      input.days.map((day) => ({
        dayOfWeek: day.day,
        isWorking: day.isWorking,
        morningStart: timeStringToDate(day.morningStart),
        morningEnd: timeStringToDate(day.morningEnd),
        afternoonStart: timeStringToDate(day.afternoonStart),
        afternoonEnd: timeStringToDate(day.afternoonEnd),
      })),
    );

    return this.getSchedule(doctorId).then((schedule) => ({
      ...schedule,
      updatedAt: new Date(Math.max(...rows.map((row) => row.updatedAt.getTime()))).toISOString(),
    }));
  }

  // ---- Doctor Leave ---------------------------------------------------------

  async getLeaves(doctorId?: string): Promise<DoctorLeaveDto[]> {
    const leaves = doctorId
      ? await this.leaveRepository.findByDoctorId(doctorId)
      : await this.leaveRepository.findAll();
    return leaves.map(toLeaveDto);
  }

  async createLeave(input: CreateDoctorLeaveDto): Promise<DoctorLeaveDto> {
    this.assertDateRange(input.startDate, input.endDate);

    const leave = await this.leaveRepository.create({
      doctorId: input.doctorId,
      leaveType: input.type,
      startDate: isoDateToDate(input.startDate),
      endDate: isoDateToDate(input.endDate),
      reason: input.reason,
    });
    return toLeaveDto(leave);
  }

  async updateLeave(id: string, input: UpdateDoctorLeaveDto): Promise<DoctorLeaveDto> {
    const existing = await this.leaveRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Leave "${id}" was not found.`);
    }

    const startDate = input.startDate ?? dateToIsoDate(existing.startDate);
    const endDate = input.endDate ?? dateToIsoDate(existing.endDate);
    this.assertDateRange(startDate, endDate);

    const { type, doctorId, reason } = input;
    const leave = await this.leaveRepository.update(id, {
      ...(doctorId ? { doctorId } : {}),
      ...(type ? { leaveType: type } : {}),
      ...(reason !== undefined ? { reason } : {}),
      startDate: isoDateToDate(startDate),
      endDate: isoDateToDate(endDate),
    });
    return toLeaveDto(leave);
  }

  async deleteLeave(id: string): Promise<void> {
    const existing = await this.leaveRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Leave "${id}" was not found.`);
    }
    await this.leaveRepository.delete(id);
  }

  private assertDateRange(startDate: string, endDate: string): void {
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after the start date.');
    }
  }

  // ---- Clinic Holidays --------------------------------------------------

  async getHolidays(): Promise<ClinicHolidayDto[]> {
    const holidays = await this.holidayRepository.findAll();
    return holidays.map(toHolidayDto);
  }

  async createHoliday(input: CreateClinicHolidayDto): Promise<ClinicHolidayDto> {
    const holiday = await this.holidayRepository.create({
      name: input.name,
      holidayDate: isoDateToDate(input.date),
      recurringYearly: input.recurringYearly,
    });
    return toHolidayDto(holiday);
  }

  async updateHoliday(id: string, input: UpdateClinicHolidayDto): Promise<ClinicHolidayDto> {
    const existing = await this.holidayRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Holiday "${id}" was not found.`);
    }

    const { date, ...rest } = input;
    const holiday = await this.holidayRepository.update(id, {
      ...rest,
      ...(date ? { holidayDate: isoDateToDate(date) } : {}),
    });
    return toHolidayDto(holiday);
  }

  async deleteHoliday(id: string): Promise<void> {
    const existing = await this.holidayRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Holiday "${id}" was not found.`);
    }
    await this.holidayRepository.delete(id);
  }

  // ---- Availability (consumed by AppointmentsService) --------------------

  /**
   * Mirrors apps/clinic-admin's AvailabilityService.isDoctorAvailableOn() minus
   * the "doctor active" check, which AppointmentsService already owns via
   * DoctorsRepository - kept out of here so this method has exactly one job:
   * holiday/leave/working-day resolution.
   */
  async isDoctorAvailableOn(doctorId: string, isoDate: string): Promise<boolean> {
    const [holidays, leaves, scheduleRows] = await Promise.all([
      this.holidayRepository.findAll(),
      this.leaveRepository.findByDoctorId(doctorId),
      this.scheduleRepository.findByDoctorId(doctorId),
    ]);

    if (this.isHolidayOn(isoDate, holidays) || this.isDoctorOnLeave(doctorId, isoDate, leaves)) {
      return false;
    }

    const dayOfWeek = getDayOfWeek(isoDate);
    const row = scheduleRows.find((r) => r.dayOfWeek === dayOfWeek);
    const isWorking = row ? row.isWorking : defaultDaySchedule(dayOfWeek).isWorking;
    return isWorking;
  }

  private isHolidayOn(isoDate: string, holidays: ClinicHoliday[]): boolean {
    return holidays.some((holiday) => {
      const holidayDate = dateToIsoDate(holiday.holidayDate);
      return holiday.recurringYearly
        ? isSameMonthAndDay(holidayDate, isoDate)
        : holidayDate === isoDate;
    });
  }

  private isDoctorOnLeave(doctorId: string, isoDate: string, leaves: DoctorLeave[]): boolean {
    return leaves.some(
      (leave) =>
        leave.doctorId === doctorId &&
        isDateInRange(isoDate, dateToIsoDate(leave.startDate), dateToIsoDate(leave.endDate)),
    );
  }
}

function toDayScheduleDto(row: DoctorSchedule): DayScheduleDto {
  return {
    day: row.dayOfWeek as DayOfWeek,
    isWorking: row.isWorking,
    morningStart: dateToTimeString(row.morningStart),
    morningEnd: dateToTimeString(row.morningEnd),
    afternoonStart: dateToTimeString(row.afternoonStart),
    afternoonEnd: dateToTimeString(row.afternoonEnd),
  };
}

function toLeaveDto(leave: DoctorLeave): DoctorLeaveDto {
  return {
    id: leave.id,
    doctorId: leave.doctorId,
    type: leave.leaveType as DoctorLeaveDto['type'],
    startDate: dateToIsoDate(leave.startDate),
    endDate: dateToIsoDate(leave.endDate),
    reason: leave.reason,
    createdAt: leave.createdAt.toISOString(),
    updatedAt: leave.updatedAt.toISOString(),
  };
}

function toHolidayDto(holiday: ClinicHoliday): ClinicHolidayDto {
  return {
    id: holiday.id,
    name: holiday.name,
    date: dateToIsoDate(holiday.holidayDate),
    recurringYearly: holiday.recurringYearly,
    createdAt: holiday.createdAt.toISOString(),
    updatedAt: holiday.updatedAt.toISOString(),
  };
}
