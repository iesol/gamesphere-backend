import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { UsersModule } from '../users/users.module';
import { Organization } from '../organizations/organization.entity';
import { config } from '../config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    UsersModule,
    JwtModule.register({
      secret: config.jwtSecret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleService],
  exports: [JwtModule],
})
export class AuthModule {}
