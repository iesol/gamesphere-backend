import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormConfig } from './form-config.entity';
import { FormConfigsController } from './form-configs.controller';
import { FormConfigsService } from './form-configs.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormConfig])],
  controllers: [FormConfigsController],
  providers: [FormConfigsService],
  exports: [FormConfigsService],
})
export class FormConfigsModule {}
