import { PartialType } from '@nestjs/swagger';
import { CreateDoctorLeaveDto } from './create-doctor-leave.dto';

// LeaveForm always submits every field on edit, but PATCH accepts a partial
// body so the API contract isn't tied to that detail (same reasoning as
// UpdateDoctorDto/UpdatePatientDto).
export class UpdateDoctorLeaveDto extends PartialType(CreateDoctorLeaveDto) {}
