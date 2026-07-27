import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { OrganizationUser } from '../users/organization-user.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { RolesGuard } from '../common/roles.guard';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match, OrganizationUser]), SseModule],
  controllers: [MatchesController],
  providers: [MatchesService, RolesGuard],
})
export class MatchesModule {}