import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameType } from './game-type.entity';
import { GameTypesController } from './game-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameType])],
  controllers: [GameTypesController],
})
export class GameTypesModule {}