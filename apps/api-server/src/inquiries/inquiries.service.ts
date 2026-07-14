import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Inquiry } from '@prisma/client';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { PatientDto } from '../patients/dto/patient.dto';
import { PatientsService } from '../patients/patients.service';
import { InquiryDto } from './dto/inquiry.dto';
import { InquiriesRepository } from './inquiries.repository';

// Sprint 25 - the "lead" side of the WhatsApp pipeline: a first-time sender
// gets an Inquiry (not a Patient) so the AI intent-classification pipeline
// can run identically for known and unknown contacts. Deliberately has no
// dependency on ConversationsModule - WebhookService (whatsapp module) and
// WorkflowDispatcherService (workflow-runtime module) already depend on both
// InquiriesModule and ConversationsModule, so they own the cross-domain
// "link this conversation to the inquiry/patient" calls; keeping that out of
// this service avoids a circular module dependency (ConversationsModule
// needs InquiriesService for context-building, so InquiriesModule can't
// depend back on ConversationsModule).
@Injectable()
export class InquiriesService {
  constructor(
    private readonly inquiriesRepository: InquiriesRepository,
    private readonly patientsService: PatientsService,
  ) {}

  async findAll(): Promise<InquiryDto[]> {
    const inquiries = await this.inquiriesRepository.findAll();
    return inquiries.map(toInquiryDto);
  }

  async findOne(id: string): Promise<InquiryDto> {
    const inquiry = await this.getOrThrow(id);
    return toInquiryDto(inquiry);
  }

  // Called by WebhookService for every inbound message from a number with no
  // matching patient - finds the sender's still-open Inquiry, or creates one.
  // Patches displayName if it was empty and Meta's payload now supplies one
  // (the very first webhook delivery for a number may arrive without a
  // resolved WhatsApp profile name).
  async resolveForWhatsappNumber(whatsappNumber: string, displayName: string): Promise<InquiryDto> {
    const existing = await this.inquiriesRepository.findOpenByWhatsappNumber(whatsappNumber);
    if (existing) {
      const shouldPatchName = displayName && !existing.displayName;
      const inquiry = shouldPatchName
        ? await this.inquiriesRepository.update(existing.id, { displayName })
        : existing;
      return toInquiryDto(inquiry);
    }

    const created = await this.inquiriesRepository.create({ whatsappNumber, displayName });
    return toInquiryDto(created);
  }

  // Creates a real Patient from an Inquiry at the moment a booking is
  // confirmed (called by WorkflowDispatcherService.handleBookAppointment()).
  // Only name + phone naturally come from WhatsApp - every other
  // clinic.patients NOT NULL field (DOB, email, address, emergency contact)
  // gets a placeholder, flagged via profileSource so staff can find and
  // complete these later. Idempotent: re-converting an already-converted
  // Inquiry throws rather than silently creating a second Patient.
  async convertToPatient(inquiryId: string): Promise<PatientDto> {
    const inquiry = await this.getOrThrow(inquiryId);
    if (inquiry.status === 'converted') {
      if (!inquiry.convertedPatientId) {
        throw new ConflictException(`Inquiry "${inquiryId}" is marked converted but has no linked patient.`);
      }
      return this.patientsService.findOne(inquiry.convertedPatientId);
    }

    const [firstName, ...rest] = (inquiry.displayName || 'WhatsApp Patient').trim().split(/\s+/);
    const lastName = rest.join(' ') || 'Patient';
    const sanitizedNumber = inquiry.whatsappNumber.replace(/[^0-9a-zA-Z]/g, '');

    const dto: CreatePatientDto = {
      firstName: firstName || 'WhatsApp',
      lastName,
      gender: 'other',
      dateOfBirth: '1900-01-01',
      mobileNumber: inquiry.whatsappNumber,
      whatsappNumber: inquiry.whatsappNumber,
      email: `whatsapp-${sanitizedNumber}@placeholder.kapisai.local`,
      bloodGroup: 'unknown',
      address: 'Not provided',
      emergencyContact: { name: 'Not provided', relationship: 'Not provided', phone: inquiry.whatsappNumber },
      allergies: '',
      medicalNotes:
        'Profile auto-created from a WhatsApp booking inquiry - incomplete, verify with the patient at first visit.',
      status: 'active',
      profileSource: 'whatsapp_inquiry',
    };

    const patient = await this.patientsService.create(dto);
    await this.inquiriesRepository.update(inquiryId, {
      status: 'converted',
      convertedPatientId: patient.id,
      convertedAt: new Date(),
    });

    return patient;
  }

  private async getOrThrow(id: string): Promise<Inquiry> {
    const inquiry = await this.inquiriesRepository.findById(id);
    if (!inquiry) {
      throw new NotFoundException(`Inquiry "${id}" was not found.`);
    }
    return inquiry;
  }
}

function toInquiryDto(inquiry: Inquiry): InquiryDto {
  return {
    id: inquiry.id,
    whatsappNumber: inquiry.whatsappNumber,
    displayName: inquiry.displayName,
    status: inquiry.status as InquiryDto['status'],
    convertedPatientId: inquiry.convertedPatientId,
    convertedAt: inquiry.convertedAt ? inquiry.convertedAt.toISOString() : null,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  };
}
