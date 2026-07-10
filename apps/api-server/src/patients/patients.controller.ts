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
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientDto } from './dto/patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

// @Public() on every route: same escape hatch DoctorsController uses - there is
// still no POST /auth/login for Angular to obtain a real access token from (see
// docs/DevelopmentGuide.md - "Backend Foundation (Sprint 11)"). Remove once one
// exists.
@Public()
@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all patients' })
  findAll(): Promise<PatientDto[]> {
    return this.patientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single patient by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PatientDto> {
    return this.patientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a patient' })
  create(@Body() input: CreatePatientDto): Promise<PatientDto> {
    return this.patientsService.create(input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a patient' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdatePatientDto,
  ): Promise<PatientDto> {
    return this.patientsService.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a patient' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.patientsService.remove(id);
  }
}
