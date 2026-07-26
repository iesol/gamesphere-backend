import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private repo: Repository<Organization>,
  ) {}

  async create(data: { name: string; slug: string }) {
    const org = this.repo.create(data);
    return this.repo.save(org);
  }

  async findAll() {
    return this.repo.find();
  }

  async findById(id: string) {
    const org = await this.repo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, data: Partial<Organization>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}
