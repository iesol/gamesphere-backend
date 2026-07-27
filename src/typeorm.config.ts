import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { OrganizationUser } from './users/organization-user.entity';
import { Organization } from './organizations/organization.entity';
import { GameType } from './game-types/game-type.entity';
import { Venue } from './venues/venue.entity';
import { Tournament } from './tournaments/tournament.entity';
import { Team } from './tournaments/team.entity';
import { TeamMember } from './tournaments/team-member.entity';
import { Match } from './matches/match.entity';
import { CricketMatchState } from './matches/cricket/cricket-match-state.entity';
import { CricketBallEvent } from './matches/cricket/cricket-ball-event.entity';
import { ChessMatchState } from './matches/chess/chess-match-state.entity';
import { ChessMoveEvent } from './matches/chess/chess-move-event.entity';
import { FormConfig } from './form-configs/form-config.entity';
import { config } from './config';

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  if (config.useSqlite) {
    return {
      type: 'sqlite',
      database: './data/gamesphere.db',
      entities: [
        User, OrganizationUser, Organization, GameType, Venue,
        Tournament, Team, TeamMember, Match,
        CricketMatchState, CricketBallEvent,
        ChessMatchState, ChessMoveEvent,
        FormConfig,
      ],
      synchronize: true,
    };
  }

  return {
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    entities: [
      User, OrganizationUser, Organization, GameType, Venue,
      Tournament, Team, TeamMember, Match,
      CricketMatchState, CricketBallEvent,
      ChessMatchState, ChessMoveEvent,
      FormConfig,
    ],
    synchronize: true,
  };
}
