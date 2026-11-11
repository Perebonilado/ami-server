import { BadRequestException, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminController } from './web/controllers/admin.controller.js';
import { AuthController } from './web/controllers/auth.controller.js';
import { CheckoutController } from './web/controllers/checkout.controller.js';
import { HealthController } from './web/controllers/health.controller.js';
import { LibraryController } from './web/controllers/library.controller.js';
import { LicencesController } from './web/controllers/licences.controller.js';
import { MeController } from './web/controllers/me.controller.js';
import { PaymentsController } from './web/controllers/payments.controller.js';
import { PayoutsController } from './web/controllers/payouts.controller.js';
import { VideosController } from './web/controllers/videos.controller.js';
import { WebhooksController } from './web/controllers/webhooks.controller.js';
import { ALL_MODELS } from './web/database/models/index.js';
import { DomainErrorFilter } from './web/filters/domain-error.filter.js';
import { ScheduledJobs } from './web/jobs/scheduled.jobs.js';
import { handlerProviders } from './web/providers/handler.providers.js';
import { adapterProviders, authProviders, repositoryProviders } from './web/providers/infrastructure.providers.js';
import { queryProviders } from './web/providers/query.providers.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('DATABASE_URL'),
        dialect: 'mysql' as const,
        models: ALL_MODELS,
        autoLoadModels: false,
        synchronize: false,
        timezone: '+00:00',
        logging: false,
        define: { underscored: true, charset: 'utf8mb4' },
      }),
    }),
    SequelizeModule.forFeature(ALL_MODELS),
  ],
  controllers: [
    HealthController,
    AuthController,
    MeController,
    VideosController,
    CheckoutController,
    PaymentsController,
    LicencesController,
    LibraryController,
    PayoutsController,
    AdminController,
    WebhooksController,
  ],
  providers: [
    ...authProviders,
    ...repositoryProviders,
    ...adapterProviders,
    ...handlerProviders,
    ...queryProviders,
    ScheduledJobs,
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: (errors) =>
          new BadRequestException(
            errors
              .flatMap((error) => [
                ...Object.values(error.constraints ?? {}),
                ...(error.children ?? []).flatMap((child) => Object.values(child.constraints ?? {})),
              ])
              .join('; ') || 'Validation failed',
          ),
      }),
    },
  ],
})
export class AppModule {}
