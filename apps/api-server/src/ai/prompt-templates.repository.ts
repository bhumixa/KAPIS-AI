import { Injectable } from '@nestjs/common';
import { Prisma, PromptTemplate } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Thin Prisma wrapper over clinic.prompt_templates - same shape
// DoctorsRepository/PatientsRepository establish, keeping PromptTemplateService
// free of query-building details.
@Injectable()
export class PromptTemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(where: Prisma.PromptTemplateWhereInput): Promise<PromptTemplate[]> {
    return this.prisma.promptTemplate.findMany({ where, orderBy: { name: 'asc' } });
  }

  findById(id: string): Promise<PromptTemplate | null> {
    return this.prisma.promptTemplate.findUnique({ where: { id } });
  }

  findActiveByType(type: string): Promise<PromptTemplate | null> {
    return this.prisma.promptTemplate.findFirst({
      where: { type, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(data: Prisma.PromptTemplateCreateInput): Promise<PromptTemplate> {
    return this.prisma.promptTemplate.create({ data });
  }

  update(id: string, data: Prisma.PromptTemplateUpdateInput): Promise<PromptTemplate> {
    return this.prisma.promptTemplate.update({ where: { id }, data });
  }

  delete(id: string): Promise<PromptTemplate> {
    return this.prisma.promptTemplate.delete({ where: { id } });
  }

  count(): Promise<number> {
    return this.prisma.promptTemplate.count();
  }
}
