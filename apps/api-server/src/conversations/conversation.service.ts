import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, ConversationNote, Prisma } from '@prisma/client';
import { ConversationsRepository } from './conversations.repository';
import { ConversationDto } from './dto/conversation.dto';
import { ConversationNoteDto } from './dto/conversation-note.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateConversationNoteDto } from './dto/create-conversation-note.dto';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { UpdateConversationNoteDto } from './dto/update-conversation-note.dto';

// Owns clinic.conversations (status/tags/assignment) and clinic.conversation_notes
// - one service rather than two, mirroring apps/clinic-admin's ConversationService
// (see docs/Architecture.md's Sprint 9 notes): notes have no independent
// lifecycle from the conversation they belong to. Assignment history
// (clinic.conversation_assignments) is written here too, as a side effect of
// update() when assignedToUserId changes - there is no separate assignment
// endpoint (see UpdateConversationDto).
@Injectable()
export class ConversationService {
  constructor(private readonly conversationsRepository: ConversationsRepository) {}

  async findAll(query: QueryConversationsDto): Promise<ConversationDto[]> {
    const where: Prisma.ConversationWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.assignedToUserId ? { assignedToUserId: query.assignedToUserId } : {}),
    };
    const conversations = await this.conversationsRepository.findAll(where);
    return conversations.map(toConversationDto);
  }

  async findOne(id: string): Promise<ConversationDto> {
    const conversation = await this.getOrThrow(id);
    return toConversationDto(conversation);
  }

  async create(input: CreateConversationDto): Promise<ConversationDto> {
    const conversation = await this.conversationsRepository.createConversation({
      patientId: input.patientId,
      channel: input.channel ?? 'whatsapp',
      status: 'open',
      tags: [],
    });
    return toConversationDto(conversation);
  }

  async update(id: string, input: UpdateConversationDto): Promise<ConversationDto> {
    await this.getOrThrow(id);

    const isAssigning = input.assignedToUserId !== undefined;

    const conversation = await this.conversationsRepository.updateConversation(id, {
      ...(input.status ? { status: input.status } : {}),
      ...(input.tags ? { tags: { set: input.tags } } : {}),
      ...(isAssigning
        ? { assignedToUserId: input.assignedToUserId }
        : {}),
    });

    // Append-only assignment history, mirroring apps/clinic-admin's
    // ConversationAssignmentService.assign()/unassign() - only recorded when
    // actually assigning to someone (unassigning, assignedToUserId === null,
    // has nothing to record: "who is unassigned" isn't an assignment event).
    if (isAssigning && input.assignedToUserId) {
      await this.conversationsRepository.createAssignment({
        conversationId: id,
        assignedToUserId: input.assignedToUserId,
        assignedToRole: input.assignedToRole ?? 'receptionist',
        assignedByName: input.assignedByName ?? 'Staff',
      });
    }

    return toConversationDto(conversation);
  }

  async getAssignmentHistory(id: string) {
    await this.getOrThrow(id);
    const history = await this.conversationsRepository.findAssignmentHistory(id);
    return history.map((assignment) => ({
      id: assignment.id,
      conversationId: assignment.conversationId,
      assignedToUserId: assignment.assignedToUserId,
      assignedToRole: assignment.assignedToRole,
      assignedByName: assignment.assignedByName,
      assignedAt: assignment.assignedAt.toISOString(),
    }));
  }

  // ---- Internal notes ----

  async getNotes(conversationId: string): Promise<ConversationNoteDto[]> {
    await this.getOrThrow(conversationId);
    const notes = await this.conversationsRepository.findNotes(conversationId);
    return notes.map(toNoteDto);
  }

  async addNote(
    conversationId: string,
    input: CreateConversationNoteDto,
  ): Promise<ConversationNoteDto> {
    await this.getOrThrow(conversationId);
    const note = await this.conversationsRepository.createNote({
      conversationId,
      authorName: input.authorName,
      body: input.body,
    });
    return toNoteDto(note);
  }

  async updateNote(
    conversationId: string,
    noteId: string,
    input: UpdateConversationNoteDto,
  ): Promise<ConversationNoteDto> {
    await this.getOrThrowNote(conversationId, noteId);
    const note = await this.conversationsRepository.updateNote(noteId, { body: input.body });
    return toNoteDto(note);
  }

  async deleteNote(conversationId: string, noteId: string): Promise<void> {
    await this.getOrThrowNote(conversationId, noteId);
    await this.conversationsRepository.deleteNote(noteId);
  }

  async getOrThrow(id: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation "${id}" was not found.`);
    }
    return conversation;
  }

  private async getOrThrowNote(conversationId: string, noteId: string): Promise<ConversationNote> {
    await this.getOrThrow(conversationId);
    const note = await this.conversationsRepository.findNoteById(noteId);
    if (!note || note.conversationId !== conversationId) {
      throw new NotFoundException(`Note "${noteId}" was not found on this conversation.`);
    }
    return note;
  }
}

function toConversationDto(conversation: Conversation): ConversationDto {
  return {
    id: conversation.id,
    patientId: conversation.patientId,
    channel: conversation.channel as ConversationDto['channel'],
    status: conversation.status as ConversationDto['status'],
    assignedToUserId: conversation.assignedToUserId,
    tags: conversation.tags,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

function toNoteDto(note: ConversationNote): ConversationNoteDto {
  return {
    id: note.id,
    conversationId: note.conversationId,
    authorName: note.authorName,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
