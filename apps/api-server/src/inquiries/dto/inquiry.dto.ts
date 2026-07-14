import { ApiProperty } from '@nestjs/swagger';

export type InquiryStatus = 'open' | 'converted' | 'closed';
export const INQUIRY_STATUSES: InquiryStatus[] = ['open', 'converted', 'closed'];

export class InquiryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  whatsappNumber!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: INQUIRY_STATUSES })
  status!: InquiryStatus;

  @ApiProperty({ nullable: true })
  convertedPatientId!: string | null;

  @ApiProperty({ nullable: true })
  convertedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
