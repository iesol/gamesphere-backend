import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MatchState {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @Column()
  orgId: string;

  @Column({ default: 0 })
  round: number;

  @Column({ default: 0 })
  positionInRound: number;

  @Column({ nullable: true })
  homeTeamId: string;

  @Column({ nullable: true })
  awayTeamId: string;

  @Column({ nullable: true })
  venueId: string;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ type: 'varchar', length: 50, default: MatchState.SCHEDULED })
  state: string;

  @Column({ type: 'simple-json', nullable: true })
  result: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  scoredBy: string | null;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
