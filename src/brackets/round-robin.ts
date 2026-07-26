import { BracketGenerator } from './bracket.interface';

export class RoundRobinBracket implements BracketGenerator {
  generate(teamIds: string[]) {
    const matches: any[] = [];
    const n = teamIds.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        matches.push({
          homeTeamId: teamIds[i],
          awayTeamId: teamIds[j],
          round: 1,
          positionInRound: matches.length,
        });
      }
    }
    return matches;
  }
}
