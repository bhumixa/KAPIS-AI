import { ApiProperty } from '@nestjs/swagger';

// GET /api/whatsapp/health response - mirrors AiProviderHealthDto/N8nHealthDto's
// configured/reachable split (here: `connected`), plus the two Sprint 20
// brief fields (`lastWebhook`/`lastOutgoing`) neither of those precedents
// needed, read from WhatsappRepository's most recent event/message rows.
export class WhatsappHealthDto {
  @ApiProperty({ description: 'Configured and reachable (a real Graph API call succeeded).' })
  connected!: boolean;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty()
  businessAccount!: string;

  @ApiProperty({ nullable: true })
  lastWebhook!: string | null;

  @ApiProperty({ nullable: true })
  lastOutgoing!: string | null;
}
