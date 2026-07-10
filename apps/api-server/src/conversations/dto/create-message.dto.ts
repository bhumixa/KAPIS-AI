import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';
import { MESSAGE_DIRECTIONS, MESSAGE_SENDERS, MessageDirection, MessageSender } from './message.dto';

// Persist-only, per the Sprint 16 brief - creating a message never calls
// WhatsApp or any AI provider, it only writes the clinic.messages row
// apps/clinic-admin's MessageTimeline/AI Draft Panel already expect.
export class CreateMessageDto {
  @ApiProperty({ enum: MESSAGE_DIRECTIONS })
  @IsIn(MESSAGE_DIRECTIONS)
  direction!: MessageDirection;

  @ApiProperty({ enum: MESSAGE_SENDERS })
  @IsIn(MESSAGE_SENDERS)
  sender!: MessageSender;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  senderName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;
}
