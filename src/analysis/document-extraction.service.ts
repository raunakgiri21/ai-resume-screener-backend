import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { CanvasFactory } from 'pdf-parse/worker';
import mammoth from 'mammoth';
import { extname } from 'node:path';
import type { UploadedFile } from './types/uploaded-file.type.js';

@Injectable()
export class DocumentExtractionService {
  private readonly maxTextLength = 100_000;

  async extract(file: UploadedFile): Promise<{
    text: string;
    truncated: boolean;
  }> {
    const extension = extname(file.originalname).toLowerCase();

    try {
      let extractedText: string;

      if (extension === '.pdf') {
        extractedText = await this.extractPdf(file.buffer);
      } else if (extension === '.docx') {
        extractedText = await this.extractDocx(file.buffer);
      } else {
        throw new BadRequestException('Unsupported document format.');
      }

      // Normalize extracted content.
      const normalizedText = extractedText
        .replace(/\0/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!normalizedText) {
        throw new BadRequestException(
          'Could not extract readable text from the uploaded document.',
        );
      }

      const truncated = normalizedText.length > this.maxTextLength;

      return {
        text: truncated
          ? normalizedText.slice(0, this.maxTextLength)
          : normalizedText,
        truncated,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Avoid exposing internal parser errors or document contents.
      throw new BadRequestException(
        `Unable to read ${extension.toUpperCase()} document. It may be corrupted or password-protected.`,
      );
    }
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
      CanvasFactory,
    });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
