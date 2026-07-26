import { Module } from '@nestjs/common';
import { BracketsController } from './brackets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../tournaments/team.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { Match } from '../matches/match.entity';
import { OrganizationUser } from '../users/organization-user.entity';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Tournament, Match, OrganizationUser])],
  controllers: [BracketsController],
  providers: [RolesGuard],
})
export class BracketModule {}
