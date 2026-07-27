import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column()
  tournamentId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ default: 0 })
  seed: number;

  @Column({ type: 'varchar', length: 50, default: 'registered' })
  status: string;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
