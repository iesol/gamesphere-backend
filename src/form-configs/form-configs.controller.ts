import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FormConfigsService } from './form-configs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../common/current-tenant.decorator';

@Controller('form-configs')
export class FormConfigsController {
  constructor(private service: FormConfigsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: { slug: string; name: string; fields: any[]; orgId?: string }) {
    return this.service.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('orgId') orgId?: string) {
    return this.service.findAll(orgId);
  }

  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  async findBySlug(@Param('slug') slug: string, @Query('orgId') orgId?: string) {
    return this.service.findBySlug(slug, orgId);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  async update(@Param('slug') slug: string, @Body() body: { name?: string; fields?: any[]; orgId?: string }) {
    return this.service.update(slug, body);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('slug') slug: string, @Query('orgId') orgId?: string) {
    return this.service.delete(slug, orgId);
  }
}
