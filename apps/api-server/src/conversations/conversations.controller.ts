import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ConversationService } from './conversation.service';
import { ConversationContextService } from './conversation-context.service';
import { ConversationHistoryService } from './conversation-history.service';
import { ConversationContextDto } from './dto/conversation-context.dto';
import { ConversationDto } from './dto/conversation.dto';
import { ConversationNoteDto } from './dto/conversation-note.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateConversationNoteDto } from './dto/create-conversation-note.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageDto } from './dto/message.dto';
import { PaginatedMessagesDto, PaginatedTimelineDto } from './dto/paginated-messages.dto';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { UpdateConversationNoteDto } from './dto/update-conversation-note.dto';
import { MessageService } from './message.service';

// @Public() on every route, same escape hatch every other business controller
// uses until a real login endpoint exists (see docs/DevelopmentGuide.md).
//
// The six routes the Sprint 16 brief names verbatim: findAll/findOne/getContext/
// getMessages/postMessage/update. A handful of small additions sit alongside
// them, each justified in its own doc comment below rather than silently
// expanding scope: create() (Angular's ConversationService.createConversation()
// needs a real endpoint), markRead() (Angular's MessageService
// .markConversationRead(), called every time Conversation Details opens, needs
// one too), and the notes/assignments sub-routes (requirement 8 explicitly
// requires Internal Notes and Assignment to work against the real backend, and
// the connected clinic.conversation_notes/clinic.conversation_assignments
// tables have no other route to live on).
@Public()
@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly contextService: ConversationContextService,
    private readonly historyService: ConversationHistoryService,
    private readonly messageService: MessageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List conversations, optionally filtered by status/patient/assignee' })
  findAll(@Query() query: QueryConversationsDto): Promise<ConversationDto[]> {
    return this.conversationService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Start a conversation for a patient' })
  create(@Body() input: CreateConversationDto): Promise<ConversationDto> {
    return this.conversationService.create(input);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single conversation by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ConversationDto> {
    return this.conversationService.findOne(id);
  }

  @Get(':id/context')
  @ApiOperation({
    summary:
      'Assemble the full Conversation Context (patient, doctor, appointments, clinic ' +
      'profile, business hours, knowledge base) - read-only, nothing is sent anywhere',
  })
  getContext(@Param('id', ParseUUIDPipe) id: string): Promise<ConversationContextDto> {
    return this.contextService.getContext(id);
  }

  @Get(':id/messages')
  @ApiOperation({
    summary:
      'Paginated conversation history, chronological. Pass includeNotes=true for the ' +
      'merged Conversation Timeline (messages + internal notes).',
  })
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryMessagesDto,
  ): Promise<PaginatedMessagesDto | PaginatedTimelineDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    return query.includeNotes === 'true'
      ? this.historyService.getTimeline(id, page, pageSize)
      : this.historyService.getMessages(id, page, pageSize);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Persist a message on this conversation (never sent anywhere)' })
  createMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: CreateMessageDto,
  ): Promise<MessageDto> {
    return this.messageService.create(id, input);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update status, tags, and/or assignment; assigning also records assignment history',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateConversationDto,
  ): Promise<ConversationDto> {
    return this.conversationService.update(id, input);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark every unread incoming message read (opening the conversation)" })
  async markRead(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.conversationService.findOne(id);
    await this.messageService.markConversationRead(id);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'List internal (staff-only) notes for this conversation' })
  getNotes(@Param('id', ParseUUIDPipe) id: string): Promise<ConversationNoteDto[]> {
    return this.conversationService.getNotes(id);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add an internal note' })
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: CreateConversationNoteDto,
  ): Promise<ConversationNoteDto> {
    return this.conversationService.addNote(id, input);
  }

  @Patch(':id/notes/:noteId')
  @ApiOperation({ summary: 'Edit an internal note' })
  updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() input: UpdateConversationNoteDto,
  ): Promise<ConversationNoteDto> {
    return this.conversationService.updateNote(id, noteId, input);
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an internal note' })
  deleteNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ): Promise<void> {
    return this.conversationService.deleteNote(id, noteId);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Append-only assignment history for this conversation' })
  getAssignments(@Param('id', ParseUUIDPipe) id: string) {
    return this.conversationService.getAssignmentHistory(id);
  }
}
