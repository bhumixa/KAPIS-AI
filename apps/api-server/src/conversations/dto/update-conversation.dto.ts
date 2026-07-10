import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { CONVERSATION_STATUSES, ConversationStatus } from './conversation.dto';

export type AssignableRole = 'receptionist' | 'doctor';
const ASSIGNABLE_ROLES: AssignableRole[] = ['receptionist', 'doctor'];

// One generic PATCH covers every mutation apps/clinic-admin's mock split across
// updateStatus()/addTag()/removeTag()/setAssignedUser() - the six required
// endpoints (see ConversationsController) have no dedicated status/tag/assign
// routes, so ConversationService.update() branches on whichever fields are
// present, the same "which fields showed up" idiom
// AppointmentsService.update() already uses for its rebooking check.
// Assigning (assignedToUserId set to a non-null value) also requires
// assignedToRole - ConversationService uses that pair to write an append-only
// clinic.conversation_assignments row, mirroring apps/clinic-admin's
// ConversationAssignmentService.assign() without a separate assignment route.
export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: CONVERSATION_STATUSES })
  @IsOptional()
  @IsIn(CONVERSATION_STATUSES)
  status?: ConversationStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ nullable: true, description: 'Set to null to unassign.' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  assignedToUserId?: string | null;

  @ApiPropertyOptional({ enum: ASSIGNABLE_ROLES })
  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES)
  assignedToRole?: AssignableRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedByName?: string;
}
