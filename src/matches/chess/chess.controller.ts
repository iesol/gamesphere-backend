import { Controller, Post, Get, Param, ParseUUIDPipe, Body, UseGuards } from '@nestjs/common';
import { ChessService } from './chess.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('chess')
export class ChessController {
  constructor(private service: ChessService) {}

  @Post(':matchId/start')
  @UseGuards(JwtAuthGuard)
  async startMatch(@Param('matchId', ParseUUIDPipe) matchId: string, @Body('whiteTeamId') whiteTeamId?: string) {
    return this.service.startMatch(matchId, whiteTeamId);
  }

  @Post(':matchId/move')
  @UseGuards(JwtAuthGuard)
  async logMove(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() body: { san: string; playerId: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.service.logMove(matchId, { ...body, volunteerId: user.id });
  }

  @Post(':matchId/end')
  @UseGuards(JwtAuthGuard)
  async endMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body('outcome') outcome: string,
  ) {
    return this.service.endMatch(matchId, outcome);
  }

  @Get(':matchId/state')
  @UseGuards(JwtAuthGuard)
  async getState(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.service.getState(matchId);
  }
}
