import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SportType {
  CRICKET = 'cricket',
  CHESS = 'chess',
  VOLLEYBALL = 'volleyball',
  BADMINTON = 'badminton',
  TABLE_TENNIS = 'table_tennis',
  FOOTBALL = 'football',
  BASKETBALL = 'basketball',
  CUSTOM = 'custom',
}

@Entity('game_types')
export class GameType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  sportType: string;

  @Column({ type: 'text', nullable: true })
  rules: string;

  @Column({ type: 'jsonb', default: {} })
  configSchema: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}