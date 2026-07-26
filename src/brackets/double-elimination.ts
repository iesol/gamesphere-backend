import { BracketGenerator } from './bracket.interface';

export class DoubleEliminationBracket implements BracketGenerator {
  generate(teamIds: string[]) {
    const { SingleEliminationBracket } = require('./single-elimination');
    const single = new SingleEliminationBracket();
    const winners = single.generate(teamIds).map((m: any) => ({ ...m, round: m.round }));
    const losers = single.generate(teamIds).map((m: any) => ({ ...m, round: m.round + 10 }));
    const final = {
      homeTeamId: 'winners_bracket_winner',
      awayTeamId: 'losers_bracket_winner',
      round: 20,
      positionInRound: 0,
    };
    return [...winners, ...losers, final];
  }
}
