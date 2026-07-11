import { ApiProperty } from '@nestjs/swagger';

// Shape returned by GoogleCalendarService.createEvent()/updateEvent()/getEvent()
// - mirrors the subset of Google's Events resource
// (https://developers.google.com/calendar/api/v3/reference/events) this
// module actually reads/writes, not the full upstream payload.
export class CalendarEventDto {
  @ApiProperty()
  googleEventId!: string;

  @ApiProperty()
  appointmentId!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiProperty({ enum: ['confirmed', 'cancelled'] })
  status!: string;

  @ApiProperty({ nullable: true })
  htmlLink!: string | null;
}
