import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChessMatchState } from './chess-match-state.entity';
import { ChessMoveEvent } from './chess-move-event.entity';
import { ChessController } from './chess.controller';
import { ChessService } from './chess.service';
import { Match } from '../match.entity';
import { SseModule } from '../../sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChessMatchState, ChessMoveEvent, Match]), SseModule],
  controllers: [ChessController],
  providers: [ChessService],
})
export class ChessModule {}
