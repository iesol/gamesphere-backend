import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../common/current-tenant.decorator';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getOrgUsers(@CurrentTenant() orgId: string) {
    const memberships = await this.usersService.getOrgUsers(orgId);
    return memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      pictureUrl: m.user.pictureUrl,
      roles: m.roles,
    }));
  }

  @Get('me/org-role')
  @UseGuards(JwtAuthGuard)
  async myOrgRole(@CurrentUser() user: { id: string }, @CurrentTenant() orgId: string) {
    const membership = await this.usersService.findOrgUser(user.id, orgId);
    if (!membership) return { roles: [] };
    return { roles: membership.roles };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async addUser(
    @Body() body: { email: string; name: string; roles: string[] },
    @CurrentTenant() orgId: string,
  ) {
    return this.usersService.onboardUser(body.email, body.name, body.roles, orgId);
  }

  @Patch(':userId/roles')
  @UseGuards(JwtAuthGuard)
  async updateRoles(
    @Param('userId') userId: string,
    @Body() body: { roles: string[] },
    @CurrentTenant() orgId: string,
  ) {
    const membership = await this.usersService.findOrgUser(userId, orgId);
    if (!membership) throw new NotFoundException('User not in this org');
    membership.roles = body.roles;
    return this.usersService.saveOrgUser(membership);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  async removeUser(@Param('userId') userId: string, @CurrentTenant() orgId: string) {
    await this.usersService.removeFromOrg(userId, orgId);
    return { message: 'User removed from org' };
  }
}
