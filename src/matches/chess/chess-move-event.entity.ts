import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chess_move_events')
export class ChessMoveEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @Column()
  moveNumber: number;

  @Column()
  playerId: string;

  @Column({ type: 'varchar', length: 20 })
  piece: string;

  @Column({ length: 5 })
  fromSquare: string;

  @Column({ length: 5 })
  toSquare: string;

  @Column({ length: 5, nullable: true })
  promotion: string;

  @Column({ length: 10 })
  san: string;

  @Column({ type: 'text' })
  fenBefore: string;

  @Column({ type: 'text' })
  fenAfter: string;

  @Column()
  volunteerId: string;

  @CreateDateColumn()
  timestamp: Date;
}
