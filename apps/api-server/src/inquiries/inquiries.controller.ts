import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { InquiryDto } from './dto/inquiry.dto';
import { InquiriesService } from './inquiries.service';

// Read-only surface - Inquiries are only ever system-created (WebhookService,
// on a first-time WhatsApp sender) or system-converted (WorkflowDispatcherService,
// on a confirmed booking), never via the public API. Matches DoctorsController's
// @Public() escape hatch (no login endpoint exists yet - see its own doc comment).
@Public()
@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all WhatsApp inquiries (leads)' })
  findAll(): Promise<InquiryDto[]> {
    return this.inquiriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single inquiry by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<InquiryDto> {
    return this.inquiriesService.findOne(id);
  }
}
