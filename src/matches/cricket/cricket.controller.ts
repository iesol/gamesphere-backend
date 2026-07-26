import { Controller, Post, Get, Patch, Param, ParseUUIDPipe, Body, UseGuards } from '@nestjs/common';
import { CricketService } from './cricket.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('cricket')
export class CricketController {
  constructor(private service: CricketService) {}

  @Post(':matchId/start')
  @UseGuards(JwtAuthGuard)
  async startMatch(@Param('matchId', ParseUUIDPipe) matchId: string, @Body() body?: { toss?: { winner: string; choice: string } }) {
    return this.service.startMatch(matchId, body?.toss);
  }

  @Post(':matchId/ball')
  @UseGuards(JwtAuthGuard)
  async logBall(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.logBall(matchId, { ...body, volunteerId: user.id });
  }

  @Post(':matchId/innings-end')
  @UseGuards(JwtAuthGuard)
  async endInnings(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.service.endInnings(matchId);
  }

  @Get(':matchId/state')
  @UseGuards(JwtAuthGuard)
  async getState(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.service.getState(matchId);
  }

  @Get(':matchId/events')
  @UseGuards(JwtAuthGuard)
  async getEvents(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.service.getEvents(matchId);
  }

  @Patch(':matchId/state')
  @UseGuards(JwtAuthGuard)
  async updateState(@Param('matchId', ParseUUIDPipe) matchId: string, @Body() body: { totalRuns?: number; wickets?: number; oversBowled?: number }, @CurrentUser() user: { id: string }) {
    return this.service.updateState(matchId, body, user.id);
  }

  @Patch('events/:eventId')
  @UseGuards(JwtAuthGuard)
  async updateEvent(@Param('eventId', ParseUUIDPipe) eventId: string, @Body() body: any, @CurrentUser() user: { id: string }) {
    return this.service.updateEvent(eventId, body, user.id);
  }
}
