import { Controller, Get, Patch, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('profile')
export class ProfileController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(@CurrentUser() user: { id: string }) {
    const u = await this.userRepo.findOne({ where: { id: user.id } });
    return u?.toPublic();
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { id: string },
    @Body() body: { name?: string; gameProfiles?: Record<string, any> },
  ) {
    const u = await this.userRepo.findOne({ where: { id: user.id } });
    if (!u) throw new NotFoundException('User not found');
    if (body.name !== undefined) u.name = body.name;
    if (body.gameProfiles !== undefined) u.gameProfiles = body.gameProfiles;
    return (await this.userRepo.save(u)).toPublic();
  }
}
