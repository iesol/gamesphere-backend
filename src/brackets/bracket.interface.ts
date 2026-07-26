export interface BracketGenerator {
  generate(teamIds: string[]): { homeTeamId: string; awayTeamId: string; round: number; positionInRound: number }[];
}
