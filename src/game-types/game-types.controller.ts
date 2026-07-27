import { Controller, Get, Post, Param, ParseUUIDPipe, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameType } from './game-type.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../common/current-tenant.decorator';

@Controller('game-types')
export class GameTypesController {
  constructor(
    @InjectRepository(GameType)
    private repo: Repository<GameType>,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: Partial<GameType>, @CurrentTenant() orgId: string) {
    const gameType = this.repo.create({ ...body, orgId });
    return this.repo.save(gameType);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentTenant() orgId: string) {
    return this.repo.find({ where: { orgId } });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() orgId: string) {
    return this.repo.findOne({ where: { id, orgId } });
  }
}