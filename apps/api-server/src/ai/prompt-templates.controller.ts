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
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { PromptTemplateDto } from './dto/prompt-template.dto';
import { QueryPromptTemplatesDto } from './dto/query-prompt-templates.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { PromptTemplateService } from './prompt-template.service';

// @Public() on every route, same escape hatch every other business controller
// uses until a real login endpoint exists (see docs/DevelopmentGuide.md).
// Mounted at its own top-level /prompt-templates path (not nested under /ai)
// per the Sprint 17 brief's explicit API list.
@Public()
@ApiTags('prompt-templates')
@Controller('prompt-templates')
export class PromptTemplatesController {
  constructor(private readonly service: PromptTemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List prompt templates, optionally filtered by type/isActive' })
  findAll(@Query() query: QueryPromptTemplatesDto): Promise<PromptTemplateDto[]> {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a prompt template' })
  create(@Body() input: CreatePromptTemplateDto): Promise<PromptTemplateDto> {
    return this.service.create(input);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single prompt template by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PromptTemplateDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prompt template' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdatePromptTemplateDto,
  ): Promise<PromptTemplateDto> {
    return this.service.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a prompt template' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
