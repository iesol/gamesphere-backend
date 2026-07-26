import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './tournament.entity';
import { Team } from './team.entity';
import { TeamMember } from './team-member.entity';
import { User } from '../users/user.entity';
import { OrganizationUser } from '../users/organization-user.entity';
import { TournamentsController, TeamsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Team, TeamMember, User, OrganizationUser])],
  controllers: [TournamentsController, TeamsController],
  providers: [TournamentsService, RolesGuard],
})
export class TournamentsModule {}
