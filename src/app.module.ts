import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AnalysisModule } from './analysis/analysis.module.js';
import { AiModule } from './ai/ai.module.js';

@Module({
  imports: [PrismaModule, AnalysisModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
