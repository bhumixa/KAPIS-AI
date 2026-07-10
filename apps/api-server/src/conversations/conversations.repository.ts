import { Injectable } from '@nestjs/common';
import {
  Conversation,
  ConversationAssignment,
  ConversationNote,
  Message,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Thin Prisma wrapper covering every table this module owns (clinic.conversations,
// clinic.messages, clinic.conversation_notes, clinic.conversation_assignments) -
// one repository per module, the same shape ScheduleModule's three
// repositories/AppointmentsRepository already established, not one repository
// per table.
@Injectable()
export class ConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Conversations ----

  findAll(where: Prisma.ConversationWhereInput): Promise<Conversation[]> {
    return this.prisma.conversation.findMany({ where, orderBy: { updatedAt: 'desc' } });
  }

  findById(id: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  createConversation(data: Prisma.ConversationCreateInput): Promise<Conversation> {
    return this.prisma.conversation.create({ data });
  }

  updateConversation(id: string, data: Prisma.ConversationUpdateInput): Promise<Conversation> {
    return this.prisma.conversation.update({ where: { id }, data });
  }

  // ---- Messages ----

  findMessages(conversationId: string, skip: number, take: number): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
      skip,
      take,
    });
  }

  countMessages(conversationId: string): Promise<number> {
    return this.prisma.message.count({ where: { conversationId } });
  }

  findAllMessages(conversationId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
    });
  }

  findLastMessage(conversationId: string): Promise<Message | null> {
    return this.prisma.message.findFirst({
      where: { conversationId },
      orderBy: { sentAt: 'desc' },
    });
  }

  countUnread(conversationId: string): Promise<number> {
    return this.prisma.message.count({
      where: { conversationId, direction: 'incoming', read: false },
    });
  }

  createMessage(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  markIncomingRead(conversationId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.message.updateMany({
      where: { conversationId, direction: 'incoming', read: false },
      data: { read: true },
    });
  }

  // ---- Internal notes ----

  findNotes(conversationId: string): Promise<ConversationNote[]> {
    return this.prisma.conversationNote.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findNoteById(id: string): Promise<ConversationNote | null> {
    return this.prisma.conversationNote.findUnique({ where: { id } });
  }

  createNote(data: Prisma.ConversationNoteCreateInput): Promise<ConversationNote> {
    return this.prisma.conversationNote.create({ data });
  }

  updateNote(id: string, data: Prisma.ConversationNoteUpdateInput): Promise<ConversationNote> {
    return this.prisma.conversationNote.update({ where: { id }, data });
  }

  deleteNote(id: string): Promise<ConversationNote> {
    return this.prisma.conversationNote.delete({ where: { id } });
  }

  // ---- Assignment history ----

  findAssignmentHistory(conversationId: string): Promise<ConversationAssignment[]> {
    return this.prisma.conversationAssignment.findMany({
      where: { conversationId },
      orderBy: { assignedAt: 'desc' },
    });
  }

  createAssignment(
    data: Prisma.ConversationAssignmentCreateInput,
  ): Promise<ConversationAssignment> {
    return this.prisma.conversationAssignment.create({ data });
  }
}
