import { PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

// The Angular form always submits every field on edit (see PatientForm.submit()),
// but PATCH accepts a partial body so the API contract isn't tied to that detail.
export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
