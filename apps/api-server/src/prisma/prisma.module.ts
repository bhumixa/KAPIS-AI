import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global so every future business module can inject PrismaService without each
// feature module re-importing it - the same "singleton data layer" role Prisma
// plays across the whole backend, not a per-feature concern.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
