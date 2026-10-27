import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RoosterWorkflowService } from './rooster-workflow.service';

/**
 * Scheduler voor het aanmaken van het rooster, die dagelijks een cron job uitvoert om het workflow proces te starten.
 */
@Injectable()
export class RoosterScheduler implements OnApplicationBootstrap
{
  private readonly logger = new Logger(RoosterScheduler.name);

  constructor(private readonly workflow: RoosterWorkflowService) {
    this.logger.log(`${RoosterScheduler.name}: Cron expression: ${process.env.CRON_MAAK_ROOSTER || '0 5 * * *'}`);
  }

  /**
   * Optioneel direct bij opstarten uitvoeren (ROOSTER_RUN_ON_STARTUP=true)
   */
  onApplicationBootstrap(): void {
    if ((process.env.ROOSTER_RUN_ON_STARTUP ?? '').toLowerCase() === 'true') {
      this.logger.log('Aanroepen maak rooster bij opstarten');
      void this.workflow.run();
    }
  }

  /**
   * Voert de rooster workflow uit wanneer de cron job wordt geactiveerd.
   */
  @Cron(process.env.CRON_MAAK_ROOSTER || '0 5 * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen maak rooster cron');
    await this.workflow.run();
  }
}
