import { BracketGenerator } from './bracket.interface';
import { SingleEliminationBracket } from './single-elimination';
import { DoubleEliminationBracket } from './double-elimination';
import { RoundRobinBracket } from './round-robin';

export function getBracketGenerator(format: string): BracketGenerator {
  switch (format) {
    case 'single_elimination': return new SingleEliminationBracket();
    case 'double_elimination': return new DoubleEliminationBracket();
    case 'round_robin': return new RoundRobinBracket();
    default: return new SingleEliminationBracket();
  }
}
