import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { DoctorLeaveDto } from './dto/doctor-leave.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';
import { ScheduleService } from './schedule.service';

@Public()
@ApiTags('schedule')
@Controller('doctor-leaves')
export class DoctorLeaveController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'List doctor leave records, optionally filtered by doctor' })
  findAll(@Query('doctorId') doctorId?: string): Promise<DoctorLeaveDto[]> {
    return this.scheduleService.getLeaves(doctorId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a doctor leave record' })
  create(@Body() input: CreateDoctorLeaveDto): Promise<DoctorLeaveDto> {
    return this.scheduleService.createLeave(input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor leave record' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateDoctorLeaveDto,
  ): Promise<DoctorLeaveDto> {
    return this.scheduleService.updateLeave(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a doctor leave record' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.scheduleService.deleteLeave(id);
  }
}
