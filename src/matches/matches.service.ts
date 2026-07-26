import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchState } from './match.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private repo: Repository<Match>,
  ) {}

  async findByTournament(tournamentId: string) {
    return this.repo.find({ where: { tournamentId }, order: { round: 'ASC', positionInRound: 'ASC' } });
  }

  async findById(id: string) {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException();
    return m;
  }

  async create(data: Partial<Match>) {
    return this.repo.save(this.repo.create(data));
  }

  async updateMatch(m: Match) {
    return this.repo.save(m);
  }

  async startMatch(id: string) {
    const m = await this.findById(id);
    if (m.state !== MatchState.SCHEDULED) {
      throw new ForbiddenException('Match cannot be started from current state');
    }
    m.state = MatchState.IN_PROGRESS;
    return this.repo.save(m);
  }

  async endMatch(id: string, result?: Record<string, any>) {
    const m = await this.findById(id);
    if (m.state !== MatchState.IN_PROGRESS) {
      throw new ForbiddenException('Match is not in progress');
    }
    m.state = MatchState.COMPLETED;
    if (result) m.result = result;
    return this.repo.save(m);
  }

  async remove(id: string) {
    const m = await this.findById(id);
    return this.repo.remove(m);
  }
}
