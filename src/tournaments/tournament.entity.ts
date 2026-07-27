import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  LEAGUE = 'league',
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'cricket' })
  sportType: string;

  @Column({ nullable: true })
  venueId: string;

  @Column({ type: 'varchar', length: 50, default: TournamentFormat.SINGLE_ELIMINATION })
  format: string;

  @Column({ type: 'timestamp', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'timestamp', nullable: true })
  registrationDeadline: Date;

  @Column({ default: 0 })
  maxParticipants: number;

  @Column({ type: 'simple-json', default: '{}' })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
