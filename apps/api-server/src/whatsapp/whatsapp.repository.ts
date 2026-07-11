import { Injectable } from '@nestjs/common';
import { Prisma, WhatsappEvent, WhatsappMedia, WhatsappMessage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Thin Prisma wrapper covering every table this module owns
// (clinic.whatsapp_messages, clinic.whatsapp_events, clinic.whatsapp_media) -
// one repository per module, same shape ConversationsRepository already
// established for its own three tables.
@Injectable()
export class WhatsappRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Messages ----

  createMessage(data: Prisma.WhatsappMessageCreateInput): Promise<WhatsappMessage> {
    return this.prisma.whatsappMessage.create({ data });
  }

  findByWaMessageId(waMessageId: string): Promise<WhatsappMessage | null> {
    return this.prisma.whatsappMessage.findFirst({ where: { waMessageId } });
  }

  updateStatus(id: string, status: string): Promise<WhatsappMessage> {
    return this.prisma.whatsappMessage.update({ where: { id }, data: { status } });
  }

  findLastOutgoingMessage(): Promise<WhatsappMessage | null> {
    return this.prisma.whatsappMessage.findFirst({
      where: { direction: 'outgoing' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- Events ----

  createEvent(data: Prisma.WhatsappEventCreateInput): Promise<WhatsappEvent> {
    return this.prisma.whatsappEvent.create({ data });
  }

  findLastEvent(): Promise<WhatsappEvent | null> {
    return this.prisma.whatsappEvent.findFirst({ orderBy: { receivedAt: 'desc' } });
  }

  // ---- Media ----

  createMedia(data: Prisma.WhatsappMediaCreateInput): Promise<WhatsappMedia> {
    return this.prisma.whatsappMedia.create({ data });
  }
}
