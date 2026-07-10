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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ClinicHolidayDto } from './dto/clinic-holiday.dto';
import { CreateClinicHolidayDto } from './dto/create-clinic-holiday.dto';
import { UpdateClinicHolidayDto } from './dto/update-clinic-holiday.dto';
import { ScheduleService } from './schedule.service';

@Public()
@ApiTags('schedule')
@Controller('clinic-holidays')
export class ClinicHolidayController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'List clinic holidays' })
  findAll(): Promise<ClinicHolidayDto[]> {
    return this.scheduleService.getHolidays();
  }

  @Post()
  @ApiOperation({ summary: 'Create a clinic holiday' })
  create(@Body() input: CreateClinicHolidayDto): Promise<ClinicHolidayDto> {
    return this.scheduleService.createHoliday(input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a clinic holiday' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateClinicHolidayDto,
  ): Promise<ClinicHolidayDto> {
    return this.scheduleService.updateHoliday(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a clinic holiday' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.scheduleService.deleteHoliday(id);
  }
}
