import { Injectable } from '@nestjs/common';
import { Prisma, WorkflowExecution } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// Thin Prisma wrapper, same role DoctorsRepository plays for doctors.service.ts -
// keeps N8nService free of query-building details.
@Injectable()
export class WorkflowExecutionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.WorkflowExecutionCreateInput): Promise<WorkflowExecution> {
    return this.prisma.workflowExecution.create({ data });
  }

  findRecent(limit: number): Promise<WorkflowExecution[]> {
    return this.prisma.workflowExecution.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  findLastByWorkflowId(workflowId: string): Promise<WorkflowExecution | null> {
    return this.prisma.workflowExecution.findFirst({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
    });
  }
}
