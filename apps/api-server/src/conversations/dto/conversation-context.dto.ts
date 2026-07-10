import { ApiProperty } from '@nestjs/swagger';
import { AppointmentDto } from '../../appointments/dto/appointment.dto';
import { DoctorDto } from '../../doctors/dto/doctor.dto';
import { PatientDto } from '../../patients/dto/patient.dto';
import { ConversationDto } from './conversation.dto';

export class BusinessHoursDayDto {
  @ApiProperty()
  day!: string;

  @ApiProperty()
  isOpen!: boolean;

  @ApiProperty()
  openTime!: string;

  @ApiProperty()
  closeTime!: string;

  @ApiProperty()
  lunchBreakStart!: string;

  @ApiProperty()
  lunchBreakEnd!: string;
}

// Subset of clinic.clinics read by ConversationContextService - field-for-field
// mirror of apps/clinic-admin's ClinicProfile model
// (features/settings/models/clinic-profile.model.ts), plus businessHours
// (that feature's separate BusinessHours model) folded in since both live on
// the same clinic.clinics row (see database/migrations/008_create_clinics.sql).
export class ClinicProfileContextDto {
  @ApiProperty()
  clinicName!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty()
  country!: string;

  @ApiProperty()
  postalCode!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  timeZone!: string;

  @ApiProperty({ type: [BusinessHoursDayDto] })
  businessHours!: BusinessHoursDayDto[];
}

export class ServiceContextDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty()
  price!: number;
}

export class FaqContextDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  question!: string;

  @ApiProperty()
  answer!: string;

  @ApiProperty()
  category!: string;
}

export class PolicyContextDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  content!: string;
}

export class MessageTemplateContextDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ type: [String] })
  variables!: string[];
}

export class KnowledgeBaseContextDto {
  @ApiProperty({ type: [FaqContextDto] })
  faqs!: FaqContextDto[];

  @ApiProperty({ type: [ServiceContextDto] })
  services!: ServiceContextDto[];

  @ApiProperty({ type: [PolicyContextDto] })
  policies!: PolicyContextDto[];

  @ApiProperty({ type: [MessageTemplateContextDto] })
  messageTemplates!: MessageTemplateContextDto[];
}

// The single object requirement 3 (Sprint 16 brief) asks for: everything a
// future AI reply-drafting feature needs about one conversation, assembled
// read-only from data that already exists elsewhere (Patients, Doctors,
// Appointments, plus the Sprint 6/7 clinic/knowledge-base tables Sprint 16
// connects to Prisma for the first time - see ConversationContextService).
// Nothing here is persisted; it's computed fresh on every GET .../context call.
export class ConversationContextDto {
  @ApiProperty({ type: ConversationDto })
  conversation!: ConversationDto;

  @ApiProperty({ type: PatientDto })
  patient!: PatientDto;

  @ApiProperty({ type: DoctorDto, nullable: true })
  doctor!: DoctorDto | null;

  @ApiProperty({ type: [AppointmentDto] })
  upcomingAppointments!: AppointmentDto[];

  @ApiProperty({ type: [AppointmentDto] })
  previousAppointments!: AppointmentDto[];

  @ApiProperty({ type: ClinicProfileContextDto, nullable: true })
  clinicProfile!: ClinicProfileContextDto | null;

  @ApiProperty({ type: KnowledgeBaseContextDto })
  knowledgeBase!: KnowledgeBaseContextDto;
}
