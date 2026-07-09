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
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { DoctorDto } from './dto/doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorsService } from './doctors.service';

// @Public() on every route: apps/api-server has no POST /auth/login yet (see
// docs/DevelopmentGuide.md - "Backend Foundation (Sprint 11)"), so the Angular
// app has no real access token to send. Remove @Public() here once a login
// endpoint exists; it's the same escape hatch HealthController already uses,
// not a change to the global JwtAuthGuard architecture.
@Public()
@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all doctors' })
  findAll(): Promise<DoctorDto[]> {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single doctor by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DoctorDto> {
    return this.doctorsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a doctor' })
  create(@Body() input: CreateDoctorDto): Promise<DoctorDto> {
    return this.doctorsService.create(input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateDoctorDto,
  ): Promise<DoctorDto> {
    return this.doctorsService.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a doctor' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.doctorsService.remove(id);
  }
}
