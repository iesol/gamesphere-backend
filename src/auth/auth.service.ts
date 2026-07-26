import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleService } from './google.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { OrganizationUser, OrgRole } from '../users/organization-user.entity';
import { Organization } from '../organizations/organization.entity';
import { config } from '../config';

@Injectable()
export class AuthService {
  constructor(
    private googleService: GoogleService,
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(OrganizationUser) private orgUserRepo: Repository<OrganizationUser>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
  ) {}

  async loginWithGoogle(credential: string) {
    const googlePayload = await this.googleService.verifyToken(credential);
    const { email, name, picture, sub: googleId } = googlePayload;

    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      const initialAdminEmail = config.initialSuperadminEmail;
      if (initialAdminEmail && email === initialAdminEmail) {
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
