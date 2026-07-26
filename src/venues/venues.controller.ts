import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from './venue.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../common/current-tenant.decorator';

@Controller('venues')
export class VenuesController {
  constructor(
    @InjectRepository(Venue)
    private repo: Repository<Venue>,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: Partial<Venue>, @CurrentTenant() orgId: string) {
    const venue = this.repo.create({ ...body, orgId });
    return this.repo.save(venue);
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<Venue>, @CurrentTenant() orgId: string) {
    await this.repo.update({ id, orgId }, body);
    return this.repo.findOne({ where: { id, orgId } });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() orgId: string) {
    return this.repo.delete({ id, orgId });
  }
}
