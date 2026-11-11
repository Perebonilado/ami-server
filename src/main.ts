import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.useBodyParser('json', { limit: '3mb' });
  app.use(cookieParser());
  app.setGlobalPrefix('api', { exclude: ['healthz'] });
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true });
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 8080), '0.0.0.0');
}
await bootstrap();
