import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisService } from './analysis.service.js';
import { FileValidationService } from './file-validation.service.js';
import { DocumentExtractionService } from './document-extraction.service.js';
import { AnalysisRepository } from './analysis.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    FileValidationService,
    DocumentExtractionService,
    AnalysisRepository,
  ],
})
export class AnalysisModule {}
