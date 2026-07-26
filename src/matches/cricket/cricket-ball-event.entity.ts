import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cricket_ball_events')
export class CricketBallEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @Column()
  innings: number;

  @Column()
  overNumber: number;

  @Column()
  ballNumber: number;

  @Column({ nullable: true })
  batsmanId: string;

  @Column({ nullable: true })
  strikerId: string;

  @Column({ nullable: true })
  nonStrikerId: string;

  @Column()
  bowlerId: string;

  @Column({ default: 0 })
  runsScored: number;

  @Column({ type: 'varchar', length: 50, default: 'none' })
  extrasType: string;

  @Column({ type: 'varchar', length: 50, default: 'none' })
  wicketType: string;

  @Column({ nullable: true })
  wicketPlayerId: string;

  @Column()
  volunteerId: string;

  @CreateDateColumn()
  timestamp: Date;
}
