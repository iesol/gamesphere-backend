import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FormConfig } from './form-config.entity';

const GLOBAL_SEED_CONFIGS = [
  {
    slug: 'add-user',
    name: 'Add User',
    fields: [
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'roles', label: 'Roles', type: 'checkbox', required: true, options: [
        { label: 'Player', value: 'player' },
        { label: 'Volunteer', value: 'volunteer' },
        { label: 'Org Admin', value: 'org_admin' },
      ]},
    ],
  },
  {
    slug: 'add-org',
    name: 'Add Organization',
    fields: [
      { key: 'name', label: 'Organization Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
    ],
  },
  {
    slug: 'add-tournament',
    name: 'Add Tournament',
    fields: [
      { key: 'name', label: 'Tournament Name', type: 'text', required: true },
      { key: 'sportType', label: 'Sport Type', type: 'select', required: true, options: [
        { label: 'Cricket', value: 'cricket' },
        { label: 'Football', value: 'football' },
        { label: 'Basketball', value: 'basketball' },
        { label: 'Chess', value: 'chess' },
        { label: 'Badminton', value: 'badminton' },
        { label: 'Tennis', value: 'tennis' },
        { label: 'Volleyball', value: 'volleyball' },
        { label: 'Other', value: 'other' },
      ]},
      { key: 'format', label: 'Format', type: 'select', required: true, options: [
        { label: 'Single Elimination', value: 'single_elimination' },
        { label: 'Double Elimination', value: 'double_elimination' },
        { label: 'Round Robin', value: 'round_robin' },
        { label: 'League', value: 'league' },
      ]},
      { key: 'startDate', label: 'Start Date & Time', type: 'date', required: false },
      { key: 'venueAddress', label: 'Venue / Address', type: 'text', required: false },
      { key: 'maxParticipants', label: 'Max Participants', type: 'number', required: false, defaultValue: 200 },
    ],
  },
  {
    slug: 'edit-profile',
    name: 'Edit Profile',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
    ],
  },
  {
    slug: 'add-game-profile',
    name: 'Add Game Profile',
    fields: [
      { key: 'sport', label: 'Sport', type: 'select', required: true, options: [
        { label: 'Cricket', value: 'cricket' },
        { label: 'Chess', value: 'chess' },
        { label: 'Other', value: 'other' },
      ]},
      { key: 'position', label: 'Position / Role', type: 'text', required: false },
      { key: 'level', label: 'Level', type: 'select', required: false, options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
        { label: 'Expert', value: 'expert' },
      ]},
    ],
  },
  {
    slug: 'edit-tournament',
    name: 'Edit Tournament',
    fields: [
      { key: 'name', label: 'Tournament Name', type: 'text', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: false },
      { key: 'endDate', label: 'End Date', type: 'date', required: false },
      { key: 'registrationDeadline', label: 'Registration Deadline', type: 'date', required: false },
    ],
  },
  {
    slug: 'add-team',
    name: 'Add Team',
    fields: [
      { key: 'name', label: 'Team Name', type: 'text', required: true },
    ],
  },
  {
    slug: 'add-match',
    name: 'Add Match',
    fields: [
      { key: 'homeTeamId', label: 'Home Team', type: 'select', required: true, options: [] },
      { key: 'awayTeamId', label: 'Away Team', type: 'select', required: true, options: [] },
      { key: 'round', label: 'Round', type: 'number', required: false, defaultValue: 1 },
      { key: 'scheduledAt', label: 'Scheduled At', type: 'date', required: false },
    ],
  },
];

@Injectable()
export class FormConfigsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(FormConfig) private repo: Repository<FormConfig>,
  ) {}

  async onApplicationBootstrap() {
    for (const cfg of GLOBAL_SEED_CONFIGS) {
      const existing = await this.repo.findOne({ where: { slug: cfg.slug, orgId: IsNull() } });
      if (!existing) {
        await this.repo.save(this.repo.create(cfg));
      }
    }
  }

  async create(data: { slug: string; name: string; fields: any[]; orgId?: string }) {
    return this.repo.save(this.repo.create(data));
  }

  async findAll(orgId?: string) {
    const where: any[] = [{ orgId: IsNull() }];
    if (orgId) where.push({ orgId });
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findBySlug(slug: string, orgId?: string) {
    if (orgId) {
      const orgCfg = await this.repo.findOne({ where: { slug, orgId } });
      if (orgCfg) return orgCfg;
    }
    const config = await this.repo.findOne({ where: { slug, orgId: IsNull() } });
    if (!config) throw new NotFoundException(`Form config '${slug}' not found`);
    return config;
  }

  async update(slug: string, data: { name?: string; fields?: any[]; orgId?: string }) {
    const where: any = { slug };
    if (data.orgId) where.orgId = data.orgId;
    else where.orgId = IsNull();
    let config = await this.repo.findOne({ where });
    if (!config && data.orgId) {
      const globalConfig = await this.repo.findOne({ where: { slug, orgId: IsNull() } });
      if (globalConfig) {
        config = this.repo.create({
          slug,
          orgId: data.orgId,
          name: data.name ?? globalConfig.name,
          fields: data.fields ?? globalConfig.fields,
          details: globalConfig.details,
        });
        return this.repo.save(config);
      }
    }
    if (!config) throw new NotFoundException(`Form config '${slug}' not found`);
    if (data.name !== undefined) config.name = data.name;
    if (data.fields !== undefined) config.fields = data.fields;
    return this.repo.save(config);
  }

  async delete(slug: string, orgId?: string) {
    const where: any = { slug };
    if (orgId) where.orgId = orgId;
    else where.orgId = IsNull();
    const config = await this.repo.findOne({ where });
    if (!config) throw new NotFoundException(`Form config '${slug}' not found`);
    return this.repo.remove(config);
  }
}
