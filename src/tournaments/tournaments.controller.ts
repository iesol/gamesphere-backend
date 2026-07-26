import { Controller, Get, Post, Patch, Delete, Param, ParseUUIDPipe, Body, UseGuards } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { OrgRole } from '../users/organization-user.entity';
import { CurrentTenant } from '../common/current-tenant.decorator';

@Controller('tournaments')
export class TournamentsController {
  constructor(private service: TournamentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async create(@Body() body: Partial<import('./tournament.entity').Tournament>, @CurrentTenant() orgId: string) {
    return this.service.create({ ...body, orgId });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentTenant() orgId: string) {
    return this.service.findAll(orgId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<import('./tournament.entity').Tournament>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id);
  }

  @Post(':id/teams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async createTeam(@Param('id', ParseUUIDPipe) id: string, @Body() body: { name: string; userIds?: string[] }) {
    return this.service.createTeam(id, body.name, body.userIds);
  }

  @Get(':id/teams')
  @UseGuards(JwtAuthGuard)
  async getTeams(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getTeams(id);
  }

  @Post(':id/auto-generate-teams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async autoGenerateTeams(@Param('id', ParseUUIDPipe) id: string, @Body() body: { teamCount: number }) {
    return this.service.autoGenerateTeams(id, body.teamCount);
  }
}

@Controller('teams')
export class TeamsController {
  constructor(private service: TournamentsService) {}

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async rename(@Param('id', ParseUUIDPipe) id: string, @Body() body: { name: string }) {
    return this.service.renameTeam(id, body.name);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async addMember(@Param('id', ParseUUIDPipe) id: string, @Body() body: { userId: string }) {
    return this.service.addTeamMember(id, body.userId);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId') userId: string) {
    return this.service.removeTeamMember(id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async deleteTeam(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteTeam(id);
  }
}
