import { Injectable, NotFoundException } from '@nestjs/common';
import { PromptTemplate } from '@prisma/client';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { PromptTemplateDto } from './dto/prompt-template.dto';
import { QueryPromptTemplatesDto } from './dto/query-prompt-templates.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { PromptTemplatesRepository } from './prompt-templates.repository';

// Owns clinic.prompt_templates - full CRUD, per the Sprint 17 brief. Reused
// (read-only) by PromptBuilderService to look up the active template for a
// given scenario type; this service is the only one that ever writes.
@Injectable()
export class PromptTemplateService {
  constructor(private readonly repository: PromptTemplatesRepository) {}

  async findAll(query: QueryPromptTemplatesDto): Promise<PromptTemplateDto[]> {
    const templates = await this.repository.findAll({
      ...(query.type ? { type: query.type } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    });
    return templates.map(toPromptTemplateDto);
  }

  async findOne(id: string): Promise<PromptTemplateDto> {
    const template = await this.getOrThrow(id);
    return toPromptTemplateDto(template);
  }

  async create(input: CreatePromptTemplateDto): Promise<PromptTemplateDto> {
    const template = await this.repository.create({
      name: input.name,
      type: input.type,
      description: input.description ?? '',
      systemPrompt: input.systemPrompt,
      userPromptTemplate: input.userPromptTemplate,
      variables: input.variables ?? [],
      isActive: input.isActive ?? true,
    });
    return toPromptTemplateDto(template);
  }

  async update(id: string, input: UpdatePromptTemplateDto): Promise<PromptTemplateDto> {
    await this.getOrThrow(id);
    const template = await this.repository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.systemPrompt !== undefined ? { systemPrompt: input.systemPrompt } : {}),
      ...(input.userPromptTemplate !== undefined
        ? { userPromptTemplate: input.userPromptTemplate }
        : {}),
      ...(input.variables !== undefined ? { variables: { set: input.variables } } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    return toPromptTemplateDto(template);
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.repository.delete(id);
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  /** Read-only lookup PromptBuilderService uses - the most recently updated active template for a type, or null. */
  async findActiveByType(type: string): Promise<PromptTemplateDto | null> {
    const template = await this.repository.findActiveByType(type);
    return template ? toPromptTemplateDto(template) : null;
  }

  private async getOrThrow(id: string): Promise<PromptTemplate> {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new NotFoundException(`Prompt template "${id}" was not found.`);
    }
    return template;
  }
}

function toPromptTemplateDto(template: PromptTemplate): PromptTemplateDto {
  return {
    id: template.id,
    name: template.name,
    type: template.type as PromptTemplateDto['type'],
    description: template.description,
    systemPrompt: template.systemPrompt,
    userPromptTemplate: template.userPromptTemplate,
    variables: template.variables,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
