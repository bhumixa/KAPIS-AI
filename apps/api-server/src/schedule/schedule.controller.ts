import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { DoctorsRepository } from '../doctors/doctors.repository';
import { DoctorScheduleDto } from './dto/doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { ScheduleService } from './schedule.service';

@Public()
@ApiTags('schedule')
@Controller('doctors/:doctorId/schedule')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly doctorsRepository: DoctorsRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get a doctor's weekly schedule" })
  async getSchedule(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
  ): Promise<DoctorScheduleDto> {
    await this.assertDoctorExists(doctorId);
    return this.scheduleService.getSchedule(doctorId);
  }

  @Put()
  @ApiOperation({ summary: "Replace a doctor's weekly schedule" })
  async updateSchedule(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Body() input: UpdateDoctorScheduleDto,
  ): Promise<DoctorScheduleDto> {
    await this.assertDoctorExists(doctorId);
    return this.scheduleService.updateSchedule(doctorId, input);
  }

  private async assertDoctorExists(doctorId: string): Promise<void> {
    const doctor = await this.doctorsRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundException(`Doctor "${doctorId}" was not found.`);
    }
  }
}
