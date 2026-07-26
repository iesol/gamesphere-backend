import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chess_match_states')
export class ChessMatchState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @Column({ nullable: true })
  whiteTeamId: string;

  @Column({ length: 10, default: 'white' })
  currentTurn: string;

  @Column({ type: 'simple-json', default: '[]' })
  moves: Array<Record<string, any>>;

  @Column({ type: 'simple-json', default: '{}' })
  capturedPieces: Record<string, any>;

  @Column({ default: false })
  isCheck: boolean;

  @Column({ default: false })
  isCheckmate: boolean;

  @Column({ default: false })
  isDraw: boolean;

  @Column({ type: 'varchar', nullable: true })
  result: string | null;

  @Column({ type: 'text', default: '' })
  pgn: string;

  @Column({ type: 'text', default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' })
  fen: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
