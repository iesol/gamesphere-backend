import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { Tournament } from './tournament.entity';
import { Team } from './team.entity';
import { TeamMember } from './team-member.entity';
import { User } from '../users/user.entity';
import { OrganizationUser } from '../users/organization-user.entity';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournRepo: Repository<Tournament>,
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMemberRepo: Repository<TeamMember>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(OrganizationUser)
    private orgUserRepo: Repository<OrganizationUser>,
  ) {}

  async create(data: Partial<Tournament>) {
    return this.tournRepo.save(this.tournRepo.create(data));
  }

  async findAll(orgId: string) {
    return this.tournRepo.find({ where: { orgId } });
  }

  async findById(id: string) {
    const t = await this.tournRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException();
    return t;
  }

  async update(id: string, data: Partial<Tournament>) {
    await this.tournRepo.update(id, data);
    return this.findById(id);
  }

  async createTeam(tournamentId: string, name: string, userIds?: string[]) {
    const t = await this.findById(tournamentId);
    const team = await this.teamRepo.save(this.teamRepo.create({ tournamentId, orgId: t.orgId, name }));
    if (userIds) {
      for (const userId of userIds) {
        await this.teamMemberRepo.save(this.teamMemberRepo.create({ teamId: team.id, userId }));
      }
    }
    return team;
  }

  async addTeamMember(teamId: string, userId: string) {
    return this.teamMemberRepo.save(this.teamMemberRepo.create({ teamId, userId }));
  }

  async removeTeamMember(teamId: string, userId: string) {
    const member = await this.teamMemberRepo.findOne({ where: { teamId, userId } });
    if (!member) throw new NotFoundException('Member not found');
    await this.teamMemberRepo.remove(member);
  }

  async renameTeam(teamId: string, name: string) {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    team.name = name;
    return this.teamRepo.save(team);
  }

  async deleteTeam(teamId: string) {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    await this.teamMemberRepo.delete({ teamId });
    return this.teamRepo.remove(team);
  }

  async getTeams(tournamentId: string) {
    const teams = await this.teamRepo.find({ where: { tournamentId } });
    const result: any[] = [];
    for (const team of teams) {
      const members = await this.teamMemberRepo.find({ where: { teamId: team.id } });
      result.push({ ...team, members });
    }
    return result;
  }

  async importPlayers(id: string, orgId: string, fileBuffer: Buffer) {
    const tournament = await this.findById(id);
    const content = fileBuffer.toString('utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    const players: any[] = [];
    let imported = 0;

    for (const row of records) {
      if (!row.email || !row.name) continue;
      let user = await this.userRepo.findOne({ where: { email: row.email } });
      if (!user) {
        user = this.userRepo.create({ email: row.email, name: row.name, gameProfiles: { [tournament.sportType]: { position: row.position || null, level: row.skill_level || null } } });
        await this.userRepo.save(user);
        await this.orgUserRepo.save(this.orgUserRepo.create({ userId: user.id, orgId, roles: ['player'] }));
      } else if (tournament.sportType && row.position) {
        const profiles = user.gameProfiles || {};
        profiles[tournament.sportType] = { position: row.position, level: row.skill_level || profiles[tournament.sportType]?.level || null };
        user.gameProfiles = profiles;
        await this.userRepo.save(user);
      }
      players.push({ userId: user.id, name: row.name, email: row.email, position: row.position || '', skillLevel: parseInt(row.skill_level) || 3 });
      imported++;
    }

    tournament.settings = { ...tournament.settings, players };
    await this.tournRepo.save(tournament);
    return { imported, total: players.length };
  }

  async delete(id: string) {
    const tournament = await this.findById(id);
    const teams = await this.teamRepo.find({ where: { tournamentId: id } });
    for (const team of teams) {
      await this.teamMemberRepo.delete({ teamId: team.id });
    }
    await this.teamRepo.delete({ tournamentId: id });
    return this.tournRepo.remove(tournament);
  }

  async autoGenerateTeams(id: string, teamCount: number) {
    const tournament = await this.findById(id);
    const players: any[] = tournament.settings?.players || [];
    if (players.length < teamCount) throw new BadRequestException('Not enough players');

    const teams: { name: string; members: any[] }[] = [];
    for (let i = 0; i < teamCount; i++) {
      teams.push({ name: `Team ${i + 1}`, members: [] });
    }

    const positions = [...new Set(players.map((p) => p.position || 'general'))];
    for (const position of positions) {
      const posPlayers = players
        .filter((p) => (p.position || 'general') === position)
        .sort((a, b) => b.skillLevel - a.skillLevel);

      let reverse = false;
      for (let i = 0; i < posPlayers.length; i++) {
        const idx = reverse ? teamCount - 1 - (i % teamCount) : i % teamCount;
        teams[idx].members.push(posPlayers[i]);
        if ((i + 1) % teamCount === 0) reverse = !reverse;
      }
    }

    for (const team of teams) {
      const created = await this.teamRepo.save(this.teamRepo.create({ tournamentId: id, orgId: tournament.orgId, name: team.name }));
      for (const member of team.members) {
        await this.teamMemberRepo.save(this.teamMemberRepo.create({ teamId: created.id, userId: member.userId }));
      }
    }

    return teams;
  }
}
