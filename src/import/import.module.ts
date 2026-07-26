import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { User } from '../users/user.entity';
import { OrganizationUser } from '../users/organization-user.entity';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, OrganizationUser])],
  controllers: [ImportController],
  providers: [ImportService, RolesGuard],
})
export class ImportModule {}
