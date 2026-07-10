import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';

// Covers two very different callers with one partial shape: AppointmentEdit
// submits every field (reschedule), while AppointmentList/AppointmentDetails'
// cancel/complete actions submit only `{ status }`. AppointmentsService tells
// them apart by checking which booking-relevant fields are present (see
// isRebooking() there) - a status-only PATCH skips re-validation entirely, the
// same bypass apps/clinic-admin's old setStatus() mock relied on.
export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}
