import { Injectable, OnApplicationBootstrap, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleService } from './google.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { OrganizationUser, OrgRole } from '../users/organization-user.entity';
import { Organization } from '../organizations/organization.entity';
import { config } from '../config';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    private googleService: GoogleService,
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(OrganizationUser) private orgUserRepo: Repository<OrganizationUser>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
  ) {}

  async loginWithGoogle(credential: string) {
    const googlePayload = await this.googleService.verifyToken(credential);
    const { email: rawEmail, name, picture, sub: googleId } = googlePayload;
    const email = rawEmail?.toLowerCase() ?? '';
    if (!email) throw new UnauthorizedException('Email not provided by Google');

    let user = await this.userRepo.findOne({ where: { email } });
    const isFirstSuperAdmin = !user && this.isInitialSuperadminEmail(email);
    if (!user) {
      if (isFirstSuperAdmin) {
        user = this.userRepo.create({ email, name: name ?? '', googleId, pictureUrl: picture ?? '' });
        user = await this.userRepo.save(user);
      } else {
        throw new UnauthorizedException('User not found. Contact your organization admin.');
      }
    }

    if (!user.googleId) {
      user.googleId = googleId;
      user.name = name ?? '';
      user.pictureUrl = picture ?? '';
      await this.userRepo.save(user);
    } else if (user.googleId !== googleId) {
      throw new UnauthorizedException('This email is already linked to a different Google account.');
    } else {
      user.name = name ?? '';
      user.pictureUrl = picture ?? '';
      await this.userRepo.save(user);
    }

    const memberships = await this.orgUserRepo.find({
      where: { userId: user.id },
      relations: ['organization'],
    });

    const orgIds = memberships.map((m) => m.orgId);
    const token = this.jwtService.sign({ sub: user.id, email: user.email, orgs: orgIds });

    return {
      token,
      user: user.toPublic(),
      organizations: memberships.map((m) => ({
        id: m.orgId,
        name: m.organization.name,
        slug: m.organization.slug,
        roles: m.roles,
      })),
    };
  }

  private isInitialSuperadminEmail(email: string): boolean {
    const configured = config.initialSuperadminEmail;
    if (!configured) return false;
    return email === configured.trim().toLowerCase();
  }

  async onApplicationBootstrap() {
    await this.seedInitialSuperadmin();
  }

  private async seedInitialSuperadmin() {
    const email = config.initialSuperadminEmail?.trim().toLowerCase();
    if (!email) return;

    const exists = await this.userRepo.findOne({ where: { email } });
    if (exists) return;

    const user = this.userRepo.create({ email, name: email.split('@')[0] });
    await this.userRepo.save(user);

    const orgCount = await this.orgRepo.count();
    if (orgCount === 0) {
      const slug = email.split('@')[0].replace(/[^a-z0-9-]/g, '-') + '-org';
      const org = this.orgRepo.create({ name: 'My Organization', slug });
      await this.orgRepo.save(org);
      await this.orgUserRepo.save(
        this.orgUserRepo.create({ userId: user.id, orgId: org.id, roles: [OrgRole.SUPER_ADMIN] }),
      );
    }
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const memberships = await this.orgUserRepo.find({
      where: { userId: user.id },
      relations: ['organization'],
    });

    const orgIds = memberships.map((m) => m.orgId);
    const token = this.jwtService.sign({ sub: user.id, email: user.email, orgs: orgIds });

    return {
      token,
      user: user.toPublic(),
      organizations: memberships.map((m) => ({
        id: m.orgId,
        name: m.organization.name,
        slug: m.organization.slug,
        roles: m.roles,
      })),
    };
  }
}
