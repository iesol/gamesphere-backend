import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CricketMatchState } from './cricket-match-state.entity';
import { CricketBallEvent } from './cricket-ball-event.entity';
import { CricketAuditLog } from './cricket-audit-log.entity';
import { Match, MatchState } from '../match.entity';
import { SseService } from '../../sse/sse.service';

@Injectable()
export class CricketService {
  constructor(
    @InjectRepository(CricketMatchState)
    private stateRepo: Repository<CricketMatchState>,
    @InjectRepository(CricketBallEvent)
    private eventRepo: Repository<CricketBallEvent>,
    @InjectRepository(CricketAuditLog)
    private auditRepo: Repository<CricketAuditLog>,
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
    private sse: SseService,
  ) {}

  async startMatch(matchId: string, toss?: { winner: string; choice: string }) {
    const existing = await this.stateRepo.findOne({ where: { matchId } });
    if (existing) return existing;
    const state = this.stateRepo.create({ matchId });
    await this.matchRepo.update(matchId, { state: 'in_progress' });
    if (toss) {
      const match = await this.matchRepo.findOne({ where: { id: matchId } });
      if (match) {
        match.result = { ...(match.result || {}), toss };
        await this.matchRepo.save(match);
      }
    }
    const saved = await this.stateRepo.save(state);
    this.sse.emit(matchId, { type: 'ball', data: { runsScored: 0, overNumber: 0, ballNumber: 0, wickets: 0, strikerId: null, nonStrikerId: null, totalRuns: 0 }, timestamp: Date.now() });
    this.sse.emit(matchId, { type: 'match_start', data: { toss }, timestamp: Date.now() });
    return saved;
  }

  async logBall(matchId: string, data: {
    strikerId?: string; nonStrikerId?: string; bowlerId: string; runsScored: number;
    extrasType: string; wicketType: string; wicketPlayerId?: string; volunteerId: string;
  }) {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (match && match.scoredBy && match.scoredBy !== data.volunteerId) {
      throw new ForbiddenException('Match is being scored by another user');
    }
    const state = await this.stateRepo.findOne({ where: { matchId } });
    if (!state) throw new ForbiddenException('Match not started');

    const isLegal = data.extrasType === 'none';
    let ballNumber: number;
    let overNumber: number;

    if (isLegal) {
      ballNumber = state.currentBall + 1;
      overNumber = state.currentOver;
      if (ballNumber > 6) {
        ballNumber = 1;
        overNumber = state.currentOver + 1;
      }
    } else {
      ballNumber = state.currentBall + 1;
      overNumber = state.currentOver;
    }

    // Update batsmen selection
    const cb = (state.currentBatsmen as any) || {};
    if (data.strikerId) cb.strikerId = data.strikerId;
    if (data.nonStrikerId) cb.nonStrikerId = data.nonStrikerId;
    state.currentBatsmen = cb as any;

    // Initialize / update batsman stats
    const stats: Record<string, any> = (state.extras as any)?.batsmenStats || {};
    const strikerId = cb.strikerId;
    const nonStrikerId = cb.nonStrikerId;
    if (strikerId && !stats[strikerId]) stats[strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
    if (nonStrikerId && !stats[nonStrikerId]) stats[nonStrikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, ...stats[nonStrikerId] };

    // Update striker stats
    if (strikerId && isLegal) {
      stats[strikerId].balls++;
      stats[strikerId].runs += data.runsScored;
      if (data.runsScored === 4) stats[strikerId].fours++;
      if (data.runsScored === 6) stats[strikerId].sixes++;
    }

    // Auto-switch on odd runs (legal ball only)
    if (strikerId && nonStrikerId && isLegal && data.runsScored % 2 === 1) {
      cb.strikerId = nonStrikerId;
      cb.nonStrikerId = strikerId;
    }

    // Wicket handling
    if (data.wicketType !== 'none') {
      state.wickets++;
      const outPlayerId = data.wicketPlayerId || strikerId;
      if (outPlayerId && stats[outPlayerId]) {
        stats[outPlayerId].out = true;
        stats[outPlayerId].dismissal = data.wicketType;
      }
      if (outPlayerId === cb.strikerId) cb.strikerId = null;
      if (outPlayerId === cb.nonStrikerId) cb.nonStrikerId = null;
      state.currentBatsmen = cb as any;
    }

    // Over-end swap: switch striker & non-striker on the 6th legal ball
    if (isLegal && ballNumber === 6) {
      const cb2 = state.currentBatsmen as any;
      if (cb2?.strikerId && cb2?.nonStrikerId) {
        [cb2.strikerId, cb2.nonStrikerId] = [cb2.nonStrikerId, cb2.strikerId];
      }
    }

    const extrasPenalty = (data.extrasType === 'wide' || data.extrasType === 'no_ball') ? 1 : 0;
    state.totalRuns += data.runsScored + extrasPenalty;
    state.battingTeamScore += data.runsScored + extrasPenalty;
    state.currentOver = overNumber;
    state.currentBall = isLegal ? ballNumber : state.currentBall;

    if (isLegal) {
      const totalLegalBalls = (overNumber * 6) + ballNumber;
      state.oversBowled = parseFloat(`${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6}`);
    }

    state.extras = { ...(state.extras as any), batsmenStats: stats } as any;
    const cbFinal = state.currentBatsmen as any;
    await this.stateRepo.save(state);

    const eventData: any = { ...data, matchId, innings: state.innings, overNumber, ballNumber, strikerId: cbFinal?.strikerId ?? null, nonStrikerId: cbFinal?.nonStrikerId ?? null };
    const event = this.eventRepo.create(eventData);
    const saved = await this.eventRepo.save(event);
    this.sse.emit(matchId, { type: 'ball', data: { runsScored: data.runsScored, overNumber, ballNumber, wickets: state.wickets, strikerId: cbFinal?.strikerId ?? null, nonStrikerId: cbFinal?.nonStrikerId ?? null, extrasType: data.extrasType, wicketType: data.wicketType }, timestamp: Date.now() });
    return saved;
  }

  async endInnings(matchId: string) {
    const state = await this.stateRepo.findOne({ where: { matchId } });
    if (!state) throw new ForbiddenException('Match not started');
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const inningsScore = { innings: state.innings, runs: state.totalRuns, wickets: state.wickets, overs: state.oversBowled, battingTeamScore: state.battingTeamScore };
    const batsmenStats = (state.extras as any)?.batsmenStats || {};
    const completedInnings = [...(match.result?.completedInnings || []), { ...inningsScore, batsmenStats }];
    match.result = { ...(match.result || {}), completedInnings };

    if (state.innings === 2) {
      match.state = MatchState.COMPLETED;
      const toss = match.result?.toss;
      if (toss) {
        const tossLoser = match.homeTeamId === toss.winner ? match.awayTeamId : match.homeTeamId;
        const inng1 = match.result.completedInnings[0];
        const inng2 = match.result.completedInnings[1];
        const team1 = toss.choice === 'bat' ? toss.winner : tossLoser;
        const team2 = toss.choice === 'bat' ? tossLoser : toss.winner;
        if (inng1.runs > inng2.runs) match.result = { ...match.result, winner: team1 };
        else if (inng2.runs > inng1.runs) match.result = { ...match.result, winner: team2 };
        else match.result = { ...match.result, winner: null };
      }
      await this.matchRepo.save(match);
      await this.stateRepo.remove(state);
      this.sse.emit(matchId, { type: 'ball', data: { runsScored: 0, overNumber: inningsScore.overs, ballNumber: 0, wickets: inningsScore.wickets, strikerId: null, nonStrikerId: null, totalRuns: inningsScore.runs }, timestamp: Date.now() });
      this.sse.emit(matchId, { type: 'match_end', data: { result: match.result }, timestamp: Date.now() });
      return { done: true };
    }

    await this.matchRepo.save(match);
    state.innings++;
    state.currentOver = 0;
    state.currentBall = 0;
    state.totalRuns = 0;
    state.wickets = 0;
    state.oversBowled = 0;
    state.battingTeamScore = 0;
    state.currentBatsmen = {} as any;
    state.extras = {} as any;
    await this.stateRepo.save(state);
    this.sse.emit(matchId, { type: 'ball', data: { runsScored: 0, overNumber: 0, ballNumber: 0, wickets: 0, strikerId: null, nonStrikerId: null, totalRuns: 0 }, timestamp: Date.now() });
    this.sse.emit(matchId, { type: 'innings_end', data: { innings: inningsScore.innings, score: inningsScore }, timestamp: Date.now() });
    return state;
  }

  async getState(matchId: string) {
    return this.stateRepo.findOne({ where: { matchId } });
  }

  async getEvents(matchId: string) {
    return this.eventRepo.find({ where: { matchId }, order: { overNumber: 'ASC', ballNumber: 'ASC' } });
  }

  async updateEvent(eventId: string, data: { runsScored?: number; extrasType?: string; wicketType?: string }, userId?: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    const before = { runsScored: event.runsScored, extrasType: event.extrasType, wicketType: event.wicketType };
    if (data.runsScored !== undefined) event.runsScored = data.runsScored;
    if (data.extrasType !== undefined) event.extrasType = data.extrasType;
    if (data.wicketType !== undefined) event.wicketType = data.wicketType;
    await this.eventRepo.save(event);
    await this.recalculateState(event.matchId);
    const updatedState = await this.stateRepo.findOne({ where: { matchId: event.matchId } });
    this.sse.emit(event.matchId, { type: 'ball', data: { runsScored: event.runsScored, overNumber: event.overNumber, ballNumber: event.ballNumber, wickets: updatedState?.wickets ?? 0, strikerId: (updatedState?.currentBatsmen as any)?.strikerId ?? null, nonStrikerId: (updatedState?.currentBatsmen as any)?.nonStrikerId ?? null, totalRuns: updatedState?.totalRuns, extrasType: event.extrasType, wicketType: event.wicketType } as any, timestamp: Date.now() });
    if (userId) {
      await this.auditRepo.save(this.auditRepo.create({
        matchId: event.matchId, eventId, action: 'edit_ball',
        changes: { before, after: { runsScored: event.runsScored, extrasType: event.extrasType, wicketType: event.wicketType }, over: `${event.overNumber}.${event.ballNumber}` },
        userId,
      }));
    }
    return event;
  }

  async updateState(matchId: string, data: { totalRuns?: number; wickets?: number; oversBowled?: number }, userId?: string) {
    const state = await this.stateRepo.findOne({ where: { matchId } });
    if (!state) throw new NotFoundException('Match state not found');
    const before = { totalRuns: state.totalRuns, wickets: state.wickets, oversBowled: state.oversBowled };
    if (data.totalRuns !== undefined) { state.totalRuns = data.totalRuns; state.battingTeamScore = data.totalRuns; }
    if (data.wickets !== undefined) state.wickets = data.wickets;
    if (data.oversBowled !== undefined) {
      state.oversBowled = data.oversBowled;
      state.currentOver = Math.floor(data.oversBowled);
      state.currentBall = Math.round((data.oversBowled % 1) * 10);
    }
    await this.stateRepo.save(state);
    this.sse.emit(matchId, { type: 'ball', data: { runsScored: 0, overNumber: state.currentOver, ballNumber: state.currentBall, wickets: state.wickets, strikerId: (state.currentBatsmen as any)?.strikerId ?? null, nonStrikerId: (state.currentBatsmen as any)?.nonStrikerId ?? null, totalRuns: state.totalRuns }, timestamp: Date.now() });
    this.sse.emit(matchId, { type: 'state_update', data: { totalRuns: state.totalRuns, wickets: state.wickets, oversBowled: state.oversBowled }, timestamp: Date.now() });
    if (userId) {
      await this.auditRepo.save(this.auditRepo.create({
        matchId, action: 'adjust_score',
        changes: { before, after: { totalRuns: state.totalRuns, wickets: state.wickets, oversBowled: state.oversBowled } },
        userId,
      }));
    }
    return state;
  }

  private async recalculateState(matchId: string) {
    const state = await this.stateRepo.findOne({ where: { matchId } });
    if (!state) return;
    const events = await this.eventRepo.find({ where: { matchId } });
    let totalRuns = 0, wickets = 0, maxOver = 0, maxBall = 0;
    for (const e of events) {
      const extrasPenalty = (e.extrasType === 'wide' || e.extrasType === 'no_ball') ? 1 : 0;
      totalRuns += e.runsScored + extrasPenalty;
      if (e.wicketType !== 'none') wickets++;
      if (e.overNumber > maxOver || (e.overNumber === maxOver && e.ballNumber > maxBall)) {
        maxOver = e.overNumber;
        maxBall = e.ballNumber;
      }
    }
    const legalBalls = events.filter((e) => e.extrasType === 'none').length;
    const oversBowled = legalBalls > 0 ? parseFloat(`${Math.floor(legalBalls / 6)}.${legalBalls % 6}`) : 0;
    state.totalRuns = totalRuns;
    state.wickets = wickets;
    state.currentOver = maxOver;
    state.currentBall = maxBall;
    state.oversBowled = oversBowled;
    state.battingTeamScore = totalRuns;
    await this.stateRepo.save(state);
  }
}
