import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Organization } from '../organizations/organization.entity';

export enum OrgRole {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  VOLUNTEER = 'volunteer',
  PLAYER = 'player',
}

@Entity('organization_users')
@Unique(['userId', 'orgId'])
export class OrganizationUser {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column() orgId: string;
  @Column({ type: 'simple-json', default: '[]' }) roles: string[];
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: User;
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'orgId' }) organization: Organization;
  @CreateDateColumn() createdAt: Date;
}
