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
import { AppointmentsService } from './appointments.service';
import { AppointmentDto } from './dto/appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

// @Public() on every route - same escape hatch DoctorsController/PatientsController
// use until a real login endpoint exists (see docs/DevelopmentGuide.md).
@Public()
@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all appointments' })
  findAll(): Promise<AppointmentDto[]> {
    return this.appointmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single appointment by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AppointmentDto> {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Book an appointment' })
  create(@Body() input: CreateAppointmentDto): Promise<AppointmentDto> {
    return this.appointmentsService.create(input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update, reschedule, cancel, or complete an appointment' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateAppointmentDto,
  ): Promise<AppointmentDto> {
    return this.appointmentsService.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an appointment' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.appointmentsService.remove(id);
  }
}
