import { Injectable } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { MessageDto } from './dto/message.dto';
import { PaginatedMessagesDto, PaginatedTimelineDto, TimelineEntryDto } from './dto/paginated-messages.dto';
import { MessageService } from './message.service';

// "Conversation History" (pagination) and "Conversation Timeline" (chronological
// ordering across incoming/outgoing/internal note/AI draft) are the same
// underlying feed described from two angles - see docs/DevelopmentGuide.md's
// Sprint 16 notes. This service is the one place that reconciles them: plain
// pagination over MessageService's rows for the default response apps/clinic-admin's
// existing Message model expects unchanged, or - when the caller asks for the
// merged view - messages plus MessageService's sibling, ConversationService's
// notes, sorted into one chronological list. No `ai_draft` entries exist yet
// (no persistence layer for them this sprint - "No external AI APIs"); the type
// is supported so a future AI drafting feature slots into this feed without
// another shape change.
@Injectable()
export class ConversationHistoryService {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  async getMessages(
    conversationId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedMessagesDto> {
    const { items, total } = await this.messageService.findPage(conversationId, page, pageSize);
    return { items, total, page, pageSize };
  }

  async getTimeline(
    conversationId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedTimelineDto> {
    const [messages, notes] = await Promise.all([
      this.messageService.findAll(conversationId),
      this.conversationService.getNotes(conversationId),
    ]);

    const entries: TimelineEntryDto[] = [
      ...messages.map((message) => toTimelineEntry(message)),
      ...notes.map((note) => ({
        id: note.id,
        type: 'internal_note' as const,
        authorName: note.authorName,
        body: note.body,
        occurredAt: note.createdAt,
      })),
    ].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    const total = entries.length;
    const start = (page - 1) * pageSize;
    const items = entries.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  }
}

function toTimelineEntry(message: MessageDto): TimelineEntryDto {
  return {
    id: message.id,
    type: message.direction,
    authorName: message.senderName,
    body: message.body,
    occurredAt: message.sentAt,
  };
}
