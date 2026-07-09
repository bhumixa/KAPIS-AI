import { PartialType } from '@nestjs/swagger';
import { CreateDoctorDto } from './create-doctor.dto';

// The Angular form always submits every field on edit (see DoctorForm.submit()),
// but PATCH accepts a partial body so the API contract isn't tied to that detail.
export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {}
