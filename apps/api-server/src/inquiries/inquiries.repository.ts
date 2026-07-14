import { Injectable } from '@nestjs/common';
import { Inquiry, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Thin Prisma wrapper - keeps InquiriesService free of query-building details,
// same shape as every other <Feature>Repository (see doctors.repository.ts).
@Injectable()
export class InquiriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Inquiry[]> {
    return this.prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<Inquiry | null> {
    return this.prisma.inquiry.findUnique({ where: { id } });
  }

  findOpenByWhatsappNumber(whatsappNumber: string): Promise<Inquiry | null> {
    return this.prisma.inquiry.findFirst({
      where: { whatsappNumber, status: 'open' },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.InquiryCreateInput): Promise<Inquiry> {
    return this.prisma.inquiry.create({ data });
  }

  update(id: string, data: Prisma.InquiryUpdateInput): Promise<Inquiry> {
    return this.prisma.inquiry.update({ where: { id }, data });
  }
}
