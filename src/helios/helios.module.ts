import { Module } from '@nestjs/common';
import { APIService } from './services/api.service';
import { LoginService } from './services/login.service';
import { RoosterService } from './services/rooster.service';

@Module({
  providers: [APIService, LoginService, RoosterService],
  exports: [APIService, LoginService, RoosterService]
})
export class HeliosModule {}
