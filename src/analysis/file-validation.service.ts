import type { UploadedFile } from './types/uploaded-file.type.js';
import { BadRequestException, Injectable } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { extname } from 'node:path';

@Injectable()
export class FileValidationService {
  private readonly maxFileSize = 5 * 1024 * 1024;

  async validate(file: UploadedFile): Promise<void> {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException('Uploaded file is empty.');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size must not exceed 5 MB.');
    }

    const extension = extname(file.originalname).toLowerCase();

    const allowedTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const expectedMime = allowedTypes[extension];

    if (!expectedMime) {
      throw new BadRequestException('Only PDF and DOCX files are supported.');
    }

    if (file.mimetype !== expectedMime) {
      throw new BadRequestException(
        'File extension and MIME type do not match.',
      );
    }

    if (extension === '.pdf') {
      const detected = await fileTypeFromBuffer(file.buffer);

      if (detected?.mime !== 'application/pdf') {
        throw new BadRequestException('Invalid PDF file signature.');
      }
    }

    if (extension === '.docx') {
      const signature = file.buffer.subarray(0, 4).toString('hex');

      // DOCX files are ZIP archives.
      if (signature !== '504b0304') {
        throw new BadRequestException('Invalid DOCX file signature.');
      }
    }
  }
}
