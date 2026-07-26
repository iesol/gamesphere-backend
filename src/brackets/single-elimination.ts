import { BracketGenerator } from './bracket.interface';

export class SingleEliminationBracket implements BracketGenerator {
  generate(teamIds: string[]) {
    const matches: any[] = [];
    const size = Math.pow(2, Math.ceil(Math.log2(teamIds.length)));
    const byes = size - teamIds.length;

    const seeded: (string | null)[] = [...teamIds];
    for (let i = 0; i < byes; i++) seeded.push(null);

    let round = 1;
    let currentRound: (string | null)[] = seeded;

    while (currentRound.length > 1) {
      const nextRound: (string | null)[] = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        matches.push({
          homeTeamId: currentRound[i],
          awayTeamId: currentRound[i + 1] || null,
          round,
          positionInRound: i / 2,
        });
        nextRound.push(currentRound[i] || currentRound[i + 1]);
      }
      currentRound = nextRound;
      round++;
    }

    return matches;
  }
}
