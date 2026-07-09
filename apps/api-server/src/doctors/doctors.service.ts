import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Doctor, Prisma } from '@prisma/client';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { DoctorDto } from './dto/doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorsRepository } from './doctors.repository';

@Injectable()
export class DoctorsService {
  constructor(private readonly doctorsRepository: DoctorsRepository) {}

  async findAll(): Promise<DoctorDto[]> {
    const doctors = await this.doctorsRepository.findAll();
    return doctors.map(toDoctorDto);
  }

  async findOne(id: string): Promise<DoctorDto> {
    const doctor = await this.doctorsRepository.findById(id);
    if (!doctor) {
      throw new NotFoundException(`Doctor "${id}" was not found.`);
    }
    return toDoctorDto(doctor);
  }

  async create(input: CreateDoctorDto): Promise<DoctorDto> {
    const doctor = await this.runUniqueCheck(() => this.doctorsRepository.create(input));
    return toDoctorDto(doctor);
  }

  async update(id: string, input: UpdateDoctorDto): Promise<DoctorDto> {
    await this.findOne(id);
    const doctor = await this.runUniqueCheck(() => this.doctorsRepository.update(id, input));
    return toDoctorDto(doctor);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.doctorsRepository.delete(id);
  }

  // registration_number and email are UNIQUE at the database layer (see
  // database/migrations/002_create_doctors.sql) - surface a violation as a 409
  // instead of letting Prisma's P2002 fall through to the 500 catch-all.
  private async runUniqueCheck(operation: () => Promise<Doctor>): Promise<Doctor> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.['target'] as string[] | undefined)?.join(', ') ?? 'field';
        throw new ConflictException(`A doctor with this ${target} already exists.`);
      }
      throw error;
    }
  }
}

function toDoctorDto(doctor: Doctor): DoctorDto {
  return {
    id: doctor.id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    gender: doctor.gender as DoctorDto['gender'],
    specialization: doctor.specialization,
    qualification: doctor.qualification,
    experienceYears: doctor.experienceYears,
    registrationNumber: doctor.registrationNumber,
    phone: doctor.phone,
    email: doctor.email,
    consultationFee: doctor.consultationFee.toNumber(),
    consultationDuration: doctor.consultationDuration,
    status: doctor.status as DoctorDto['status'],
    createdAt: doctor.createdAt.toISOString(),
    updatedAt: doctor.updatedAt.toISOString(),
  };
}
