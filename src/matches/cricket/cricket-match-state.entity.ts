import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cricket_match_states')
export class CricketMatchState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @Column({ default: 1 })
  innings: number;

  @Column({ default: 0 })
  currentOver: number;

  @Column({ default: 0 })
  currentBall: number;

  @Column({ default: 0 })
  totalRuns: number;

  @Column({ default: 0 })
  wickets: number;

  @Column({ type: 'simple-json', default: '{}' })
  extras: Record<string, any>;

  @Column({ default: 0 })
  battingTeamScore: number;

  @Column({ default: 0 })
  bowlingTeamScore: number;

  @Column({ type: 'float', default: 0 })
  oversBowled: number;

  @Column({ type: 'simple-json', default: '{}' })
  currentBatsmen: Record<string, any>;

  @Column({ type: 'simple-json', default: '{}' })
  currentBowler: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
