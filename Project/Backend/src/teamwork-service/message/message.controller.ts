import { Controller, Get, Param, Query, Headers, Delete } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('api/v1/teamwork')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('stickers/trending')
  async getStickersTrending() {
    return this.messageService.getStickersTrending();
  }

  @Get('stickers/search')
  async getStickersSearch(@Query('q') query: string) {
    return this.messageService.getStickersSearch(query || '');
  }

  @Get('groups/:groupId/messages')
  async getMessages(
    @Headers('x-user-id') userId: string,
    @Param('groupId') groupId: string,
    @Query('taskId') taskId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    return this.messageService.getMessages(
      userId,
      groupId,
      taskId || undefined,
      parsedLimit,
      cursor || undefined,
    );
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @Headers('x-user-id') userId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messageService.delete(userId, messageId);
  }
}
