import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from '../common/roles.guard';
import { CreateOrgGuard } from './create-org.guard';
import { OrganizationUser } from '../users/organization-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationUser]), UsersModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, RolesGuard, CreateOrgGuard],
})
export class OrganizationsModule {}
