import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { ConversationService } from './conversation.service';
import { ConversationsRepository } from './conversations.repository';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageDto } from './dto/message.dto';

// Owns clinic.messages exclusively - read and write - mirroring
// apps/clinic-admin's MessageService owning the message timeline. Never calls
// WhatsApp or an AI provider (Sprint 16 brief: "Do not send messages anywhere.
// Persist everything only.") - create() is a straight insert. Depends on
// ConversationService only to confirm the parent conversation exists (a 404
// beats a Prisma FK-violation 500) - one-directional, ConversationService has
// no reason to depend back on MessageService.
@Injectable()
export class MessageService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
    private readonly conversationService: ConversationService,
  ) {}

  async findPage(
    conversationId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: MessageDto[]; total: number }> {
    await this.conversationService.findOne(conversationId);
    const [messages, total] = await Promise.all([
      this.conversationsRepository.findMessages(conversationId, (page - 1) * pageSize, pageSize),
      this.conversationsRepository.countMessages(conversationId),
    ]);
    return { items: messages.map(toMessageDto), total };
  }

  async findAll(conversationId: string): Promise<MessageDto[]> {
    const messages = await this.conversationsRepository.findAllMessages(conversationId);
    return messages.map(toMessageDto);
  }

  async create(conversationId: string, input: CreateMessageDto): Promise<MessageDto> {
    await this.conversationService.findOne(conversationId);
    const message = await this.conversationsRepository.createMessage({
      conversationId,
      direction: input.direction,
      sender: input.sender,
      senderName: input.senderName,
      body: input.body,
      // An outgoing (staff/AI) message is trivially "read" the moment it's
      // sent; only an incoming patient message can be unread. apps/clinic-admin's
      // Sprint 9 mock computed this as `direction === 'incoming'` (inverted -
      // harmless there since every mock call site only ever sent 'outgoing'),
      // fixed here since this is the first place that formula runs for real.
      read: input.direction === 'outgoing',
    });
    return toMessageDto(message);
  }

  async markConversationRead(conversationId: string): Promise<void> {
    await this.conversationsRepository.markIncomingRead(conversationId);
  }

  async getUnreadCount(conversationId: string): Promise<number> {
    return this.conversationsRepository.countUnread(conversationId);
  }

  async getLastMessage(conversationId: string): Promise<MessageDto | null> {
    const message = await this.conversationsRepository.findLastMessage(conversationId);
    return message ? toMessageDto(message) : null;
  }
}

function toMessageDto(message: Message): MessageDto {
  return {
    id: message.id,
    conversationId: message.conversationId,
    direction: message.direction as MessageDto['direction'],
    sender: message.sender as MessageDto['sender'],
    senderName: message.senderName,
    body: message.body,
    read: message.read,
    sentAt: message.sentAt.toISOString(),
  };
}
