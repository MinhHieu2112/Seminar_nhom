import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TcpClientService } from '../tcp-client.service';
import { JwtService } from '@nestjs/jwt';
import { safeSend, extractUserId } from '../gateway.utils';

@Controller('api/v1/calendar')
export class CalendarGatewayController {
  constructor(
    private readonly tcpClient: TcpClientService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('events')
  createEvent(@Headers('authorization') authHeader: string, @Body() body: any) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.event.create',
      { userId, dto: body },
    );
  }

  @Get('events')
  listEvents(
    @Headers('authorization') authHeader: string,
    @Query() query: { from?: string; to?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'calendar-service', 'calendar.event.list', {
      userId,
      from: query.from,
      to: query.to,
    });
  }

  @Get('events/:id')
  getEvent(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(this.tcpClient, 'calendar-service', 'calendar.event.get', {
      id,
      userId,
    });
  }

  @Patch('events/:id')
  updateEvent(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.event.update',
      { id, userId, dto: body },
    );
  }

  @Delete('events/:id')
  deleteEvent(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.event.delete',
      { id, userId },
    );
  }

  @Get('free-slots')
  getFreeSlots(
    @Headers('authorization') authHeader: string,
    @Query() query: { from: string; to: string; minDurationMin?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.freeslots.get',
      {
        userId,
        from: query.from,
        to: query.to,
        minDurationMin: query.minDurationMin
          ? Number(query.minDurationMin)
          : undefined,
      },
    );
  }

  @Post('conflicts/check')
  @HttpCode(HttpStatus.OK)
  checkConflict(
    @Headers('authorization') authHeader: string,
    @Body()
    body: { startTime: string; endTime: string; excludeEventId?: string },
  ) {
    const userId = extractUserId(authHeader, this.jwtService);
    return safeSend(
      this.tcpClient,
      'calendar-service',
      'calendar.conflict.check',
      { userId, ...body },
    );
  }
}
