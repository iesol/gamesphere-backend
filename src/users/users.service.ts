import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { OrganizationUser } from './organization-user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(OrganizationUser) private orgUserRepo: Repository<OrganizationUser>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findOrgUser(userId: string, orgId: string): Promise<OrganizationUser | null> {
    return this.orgUserRepo.findOne({ where: { userId, orgId } });
  }

  async saveOrgUser(membership: OrganizationUser) {
    return this.orgUserRepo.save(membership);
  }

  async createUser(data: { email: string; name: string }): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async getOrgUsers(orgId: string): Promise<OrganizationUser[]> {
    return this.orgUserRepo.find({
      where: { orgId },
      relations: ['user'],
    });
  }

  async addUserToOrg(userId: string, orgId: string, roles: string[]): Promise<OrganizationUser> {
    const existing = await this.orgUserRepo.findOne({ where: { userId, orgId } });
    if (existing) {
      existing.roles = [...new Set([...existing.roles, ...roles])];
      return this.orgUserRepo.save(existing);
    }
    const orgUser = this.orgUserRepo.create({ userId, orgId, roles });
    return this.orgUserRepo.save(orgUser);
  }

  async onboardUser(email: string, name: string, roles: string[], orgId: string) {
    let user = await this.findByEmail(email);
    if (!user) {
      user = await this.createUser({ email, name });
    }
    await this.addUserToOrg(user.id, orgId, roles);
    return { id: user.id, email: user.email, name: user.name, roles };
  }

  async removeFromOrg(userId: string, orgId: string) {
    const membership = await this.orgUserRepo.findOne({ where: { userId, orgId } });
    if (!membership) throw new NotFoundException('User not found in this org');
    await this.orgUserRepo.remove(membership);
  }
}
