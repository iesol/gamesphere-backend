import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cricket_audit_logs')
export class CricketAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matchId: string;

  @Column({ nullable: true })
  eventId: string;

  @Column()
  action: string;

  @Column({ type: 'simple-json' })
  changes: Record<string, any>;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
