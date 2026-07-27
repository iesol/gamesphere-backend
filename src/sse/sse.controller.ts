import { Controller, Get, Param, ParseUUIDPipe, Query, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
  constructor(private sseService: SseService) {}

  @Get(':matchId')
  async stream(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      res.status(401).json({ error: 'Token required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const subject = this.sseService.getSubject(matchId);
    const subscription = subject.subscribe({
      next: (event) => {
        try {
          if (!res.destroyed) {
            res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
          }
        } catch {
          subscription.unsubscribe();
          clearInterval(heartbeat);
        }
      },
      error: () => {},
    });

    res.write(`event: connected\ndata: {}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        if (!res.destroyed) {
          res.write(`event: heartbeat\ndata: {}\n\n`);
        }
      } catch {
        subscription.unsubscribe();
        clearInterval(heartbeat);
      }
    }, 30000);

    const request = res.req as Request;
    request.on('close', () => {
      subscription.unsubscribe();
      clearInterval(heartbeat);
    });
  }
}
