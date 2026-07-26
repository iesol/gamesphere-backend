import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CricketMatchState } from './cricket-match-state.entity';
import { CricketBallEvent } from './cricket-ball-event.entity';
import { CricketAuditLog } from './cricket-audit-log.entity';
import { Match } from '../match.entity';
import { CricketController } from './cricket.controller';
import { CricketService } from './cricket.service';
import { SseModule } from '../../sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([CricketMatchState, CricketBallEvent, CricketAuditLog, Match]), SseModule],
  controllers: [CricketController],
  providers: [CricketService],
})
export class CricketModule {}
