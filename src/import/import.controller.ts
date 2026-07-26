import { Controller, Post, Get, Param, ParseUUIDPipe, UseGuards, UseInterceptors, UploadedFile, Query, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { OrgRole } from '../users/organization-user.entity';
import { CurrentTenant } from '../common/current-tenant.decorator';

@Controller('import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(
    @UploadedFile() file: Express.Multer.File,
    @CurrentTenant() orgId: string,
    @Query('duplicate') duplicateMode: 'skip' | 'update' = 'skip',
  ) {
    return this.importService.importUsers(orgId, file.buffer, file.mimetype, duplicateMode);
  }

  @Get('template')
  async downloadTemplate(@Res() res: any) {
    const header = 'email,name,phone,game1,position1,level1,game2,position2,level2\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="import-template.csv"');
    res.send(header);
  }
}
