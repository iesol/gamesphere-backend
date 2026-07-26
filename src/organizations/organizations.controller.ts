import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { CreateOrgGuard } from './create-org.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UsersService } from '../users/users.service';
import { OrgRole } from '../users/organization-user.entity';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private orgService: OrganizationsService,
    private usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, CreateOrgGuard)
  async create(@Body() body: { name: string; slug: string }, @CurrentUser() user: { id: string }) {
    const org = await this.orgService.create(body);
    await this.usersService.addUserToOrg(user.id, org.id, [OrgRole.SUPER_ADMIN]);
    return org;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.orgService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: { name?: string }) {
    return this.orgService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.SUPER_ADMIN)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.delete(id);
  }
}
