import { Injectable, NotFoundException } from '@nestjs/common';
import { Patient } from '@prisma/client';
import { dateToIsoDate, isoDateToDate } from '../common/utils/date-time.util';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientDto } from './dto/patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async findAll(): Promise<PatientDto[]> {
    const patients = await this.patientsRepository.findAll();
    return patients.map(toPatientDto);
  }

  async findOne(id: string): Promise<PatientDto> {
    const patient = await this.patientsRepository.findById(id);
    if (!patient) {
      throw new NotFoundException(`Patient "${id}" was not found.`);
    }
    return toPatientDto(patient);
  }

  // Sprint 20 (WhatsApp Cloud API) - WebhookService's only route from an
  // inbound message's `from` number to a Conversation. Returns null (not a
  // 404) since "no patient for this number" is an expected, handled case for
  // a webhook, not an error.
  async findByWhatsappNumber(whatsappNumber: string): Promise<PatientDto | null> {
    const patient = await this.patientsRepository.findByWhatsappNumber(whatsappNumber);
    return patient ? toPatientDto(patient) : null;
  }

  async create(input: CreatePatientDto): Promise<PatientDto> {
    const patient = await this.patientsRepository.create(toCreateInput(input));
    return toPatientDto(patient);
  }

  async update(id: string, input: UpdatePatientDto): Promise<PatientDto> {
    await this.findOne(id);
    const patient = await this.patientsRepository.update(id, toUpdateInput(input));
    return toPatientDto(patient);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.patientsRepository.delete(id);
  }
}

function toCreateInput(input: CreatePatientDto) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    dateOfBirth: isoDateToDate(input.dateOfBirth),
    mobileNumber: input.mobileNumber,
    whatsappNumber: input.whatsappNumber,
    email: input.email,
    bloodGroup: input.bloodGroup,
    address: input.address,
    emergencyContactName: input.emergencyContact.name,
    emergencyContactRelationship: input.emergencyContact.relationship,
    emergencyContactPhone: input.emergencyContact.phone,
    allergies: input.allergies,
    medicalNotes: input.medicalNotes,
    status: input.status,
    profileSource: input.profileSource ?? 'manual',
  };
}

function toUpdateInput(input: UpdatePatientDto) {
  const { emergencyContact, dateOfBirth, ...rest } = input;

  return {
    ...rest,
    ...(dateOfBirth ? { dateOfBirth: isoDateToDate(dateOfBirth) } : {}),
    ...(emergencyContact
      ? {
          emergencyContactName: emergencyContact.name,
          emergencyContactRelationship: emergencyContact.relationship,
          emergencyContactPhone: emergencyContact.phone,
        }
      : {}),
  };
}

export function toPatientDto(patient: Patient): PatientDto {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    gender: patient.gender as PatientDto['gender'],
    dateOfBirth: dateToIsoDate(patient.dateOfBirth),
    mobileNumber: patient.mobileNumber,
    whatsappNumber: patient.whatsappNumber,
    email: patient.email,
    bloodGroup: patient.bloodGroup as PatientDto['bloodGroup'],
    address: patient.address,
    emergencyContact: {
      name: patient.emergencyContactName,
      relationship: patient.emergencyContactRelationship,
      phone: patient.emergencyContactPhone,
    },
    allergies: patient.allergies,
    medicalNotes: patient.medicalNotes,
    status: patient.status as PatientDto['status'],
    profileSource: patient.profileSource as PatientDto['profileSource'],
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}
