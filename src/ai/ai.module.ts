import { Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { PromptService } from './prompt.service.js';

@Module({
  providers: [AiService, PromptService],
  exports: [AiService],
})
export class AiModule {}
