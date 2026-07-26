import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('form_configs')
@Unique(['slug', 'orgId'])
export class FormConfig {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() slug: string;
  @Column({ nullable: true }) orgId: string;
  @Column() name: string;
  @Column({ type: 'simple-json', default: '[]' }) fields: any[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
