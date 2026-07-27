import { Controller, Get, Post, Delete, Param, ParseUUIDPipe, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { OrgRole } from '../users/organization-user.entity';
import { CurrentTenant } from '../common/current-tenant.decorator';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('matches')
export class MatchesController {
  constructor(private service: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async create(@Body() body: { tournamentId: string; homeTeamId: string; awayTeamId: string; scheduledAt?: string }, @CurrentTenant() orgId: string) {
    return this.service.create({ ...body, scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined, orgId });
  }

  @Get('tournament/:tournamentId')
  @UseGuards(JwtAuthGuard)
  async findByTournament(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    return this.service.findByTournament(tournamentId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async startMatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.startMatch(id);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  async endMatch(@Param('id', ParseUUIDPipe) id: string, @Body('result') result?: Record<string, any>) {
    return this.service.endMatch(id, result);
  }

  @Post(':id/lock')
  @UseGuards(JwtAuthGuard)
  async lock(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    const match = await this.service.findById(id);
    const stale = match.lockedAt && Date.now() - new Date(match.lockedAt).getTime() > 60000;
    if (match.scoredBy && match.scoredBy !== user.id && !stale) {
      throw new ForbiddenException('Match is already being scored by another user');
    }
    match.scoredBy = user.id;
    match.lockedAt = new Date();
    return this.service.updateMatch(match);
  }

  @Post(':id/lock/heartbeat')
  @UseGuards(JwtAuthGuard)
  async heartbeat(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    const match = await this.service.findById(id);
    if (match.scoredBy === user.id) {
      match.lockedAt = new Date();
      await this.service.updateMatch(match);
    }
    return { ok: true };
  }

  @Delete(':id/lock')
  @UseGuards(JwtAuthGuard)
  async unlock(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    const match = await this.service.findById(id);
    if (match.scoredBy === user.id) {
      match.scoredBy = null;
      match.lockedAt = null;
      return this.service.updateMatch(match);
    }
    return match;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { message: 'Match deleted' };
  }
}
