import { Controller, Get, Post, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../tournaments/tournament.entity';
import { Team } from '../tournaments/team.entity';
import { Match } from '../matches/match.entity';
import { getBracketGenerator } from './bracket.factory';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { OrgRole } from '../users/organization-user.entity';

@Controller('brackets')
export class BracketsController {
  constructor(
    @InjectRepository(Tournament)
    private tournRepo: Repository<Tournament>,
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
  ) {}

  @Post('generate/:tournamentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async generate(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    const tournament = await this.tournRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) return { error: 'Tournament not found' };

    const teams = await this.teamRepo.find({ where: { tournamentId } });
    const gen = getBracketGenerator(tournament.format);
    const bracketMatches = gen.generate(teams.map((t) => t.id));

    for (const bm of bracketMatches) {
      await this.matchRepo.save(
        this.matchRepo.create({
          tournamentId,
          orgId: tournament.orgId,
          homeTeamId: bm.homeTeamId,
          awayTeamId: bm.awayTeamId,
          round: bm.round,
          positionInRound: bm.positionInRound,
        }),
      );
    }

    return { message: `Generated ${bracketMatches.length} matches` };
  }

  @Get(':tournamentId')
  @UseGuards(JwtAuthGuard)
  async getBracket(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    const tournament = await this.tournRepo.findOne({ where: { id: tournamentId } });
    if (!tournament) return { error: 'Tournament not found' };

    const matches = await this.matchRepo.find({
      where: { tournamentId },
      order: { round: 'ASC', positionInRound: 'ASC' },
    });

    const rounds: Record<number, any> = {};
    for (const m of matches) {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    }

    return {
      tournament: tournament.name,
      format: tournament.format,
      rounds: Object.entries(rounds).map(([round, matches]) => ({
        round: parseInt(round),
        matches,
      })),
    };
  }
}
