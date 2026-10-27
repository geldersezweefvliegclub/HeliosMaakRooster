import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { HeliosModule } from './helios/helios.module';
import { RoosterModule } from './rooster/rooster.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HELIOS_CREDENTIAL_FILE: Joi.string().optional(),

        CRON_MAAK_ROOSTER: Joi.string().optional(),
        CRON_TIMEZONE: Joi.string().optional(),
        ROOSTER_DAGEN_VOORUIT: Joi.number().integer().min(1).optional(),
        ROOSTER_RUN_ON_STARTUP: Joi.string().valid('true', 'false').optional(),

        DDWV: Joi.string().valid('true', 'false').optional(),
        DDWV_START: Joi.string().pattern(/^\d{2}-\d{2}$/).optional(),
        DDWV_EIND: Joi.string().pattern(/^\d{2}-\d{2}$/).optional(),

        LOGGER_SERVER_URL: Joi.string().allow('').optional(),
        LOGGER_API_KEY: Joi.string().allow('').optional(),
        LOGGER_LEVEL: Joi.string().optional(),
        INSTANCE: Joi.string().optional(),
      })
    }),
    ScheduleModule.forRoot(),
    HeliosModule,
    RoosterModule
  ]
})
export class AppModule {}
