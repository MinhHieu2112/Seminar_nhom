import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  groupId: string;

  @IsString()
  @IsOptional()
  taskId?: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'STICKER';

  @IsArray()
  @IsOptional()
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];

  @IsOptional()
  sticker?: {
    stickerId: string;
    stickerUrl: string;
    packName?: string;
  };
}
