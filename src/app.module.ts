import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { getTypeOrmConfig } from './typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { VenuesModule } from './venues/venues.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { MatchesModule } from './matches/matches.module';
import { CricketModule } from './matches/cricket/cricket.module';
import { ChessModule } from './matches/chess/chess.module';
import { ImportModule } from './import/import.module';
import { BracketModule } from './brackets/bracket.module';
import { FormConfigsModule } from './form-configs/form-configs.module';
import { ProfileModule } from './profile/profile.module';
import { SseModule } from './sse/sse.module';
import { TenantMiddleware } from './common/tenant.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    VenuesModule,
    TournamentsModule,
    MatchesModule,
    CricketModule,
    ChessModule,
    ImportModule,
    BracketModule,
    SseModule,
    FormConfigsModule,
    ProfileModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).exclude(
      { path: 'auth/google', method: RequestMethod.POST },
      { path: 'auth/me', method: RequestMethod.GET },
      { path: 'organizations', method: RequestMethod.POST },
      { path: 'organizations', method: RequestMethod.GET },
      { path: 'profile', method: RequestMethod.ALL },
      { path: 'profile/(.*)', method: RequestMethod.ALL },
      { path: 'form-configs', method: RequestMethod.ALL },
      { path: 'form-configs/(.*)', method: RequestMethod.ALL },
    ).forRoutes('*');
  }
}
