import { Module } from '@nestjs/common';
import { HeliosModule } from '../helios/helios.module';
import { RoosterScheduler } from './rooster.scheduler';
import { RoosterWorkflowService } from './rooster-workflow.service';
import { RoosterBuilder } from './rooster.builder';

@Module({
  imports: [HeliosModule],
  providers: [RoosterScheduler, RoosterWorkflowService, RoosterBuilder]
})
export class RoosterModule
{}
