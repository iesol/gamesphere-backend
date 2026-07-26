import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChessMatchState } from './chess-match-state.entity';
import { ChessMoveEvent } from './chess-move-event.entity';
import { Match, MatchState } from '../match.entity';
import { SseService } from '../../sse/sse.service';

@Injectable()
export class ChessService {
  constructor(
    @InjectRepository(ChessMatchState)
    private stateRepo: Repository<ChessMatchState>,
    @InjectRepository(ChessMoveEvent)
    private eventRepo: Repository<ChessMoveEvent>,
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
    private sse: SseService,
  ) {}

  async startMatch(matchId: string, whiteTeamId?: string) {
    const existing = await this.stateRepo.findOne({ where: { matchId } });
    if (existing) return existing;
    await this.matchRepo.update(matchId, { state: MatchState.IN_PROGRESS });
    const state = this.stateRepo.create({ matchId, whiteTeamId });
    return this.stateRepo.save(state);
  }

  async logMove(matchId: string, data: {
    san: string; playerId: string; volunteerId: string;
  }) {
    const state = await this.stateRepo.findOne({ where: { matchId } });
    if (!state) throw new ForbiddenException('Match not started');
    if (state.isCheckmate || state.isDraw) throw new ForbiddenException('Game is over');

    const moveHistory = (state.moves as Array<{ san: string }>).map(m => m.san);
    const moveCount = moveHistory.length + 1;
    state.moves = [...state.moves, { san: data.san, playerId: data.playerId, moveNumber: moveCount }];
    state.currentTurn = state.currentTurn === 'white' ? 'black' : 'white';
    await this.stateRepo.save(state);

    const event = this.eventRepo.create({
      matchId, moveNumber: moveCount,
      piece: '', fromSquare: '', toSquare: '',
      san: data.san, fenBefore: '', fenAfter: '',
      playerId: data.playerId, volunteerId: data.volunteerId,
    });
    const saved = await this.eventRepo.save(event);
    this.sse.emit(matchId, { type: 'move', data: { san: data.san, moveNumber: moveCount }, timestamp: Date.now() });
    return saved;
  }

  async endMatch(matchId: string, outcome: string) {
    const state = await this.stateRepo.findOne({ where: { matchId } });
    if (!state) throw new ForbiddenException('Match not started');
    state.result = outcome;
    state.isCheckmate = outcome === 'checkmate';
    state.isDraw = outcome === 'draw';
    return this.stateRepo.save(state);
  }

  async getState(matchId: string) {
    return this.stateRepo.findOne({ where: { matchId } });
  }
}
