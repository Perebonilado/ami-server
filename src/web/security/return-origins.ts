import type { ConfigService } from '@nestjs/config';

export class ReturnOrigins {
  private readonly origins: string[];

  constructor(config: ConfigService) {
    const extra = (config.get<string>('DEMO_ORIGINS') ?? '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean);
    this.origins = [config.getOrThrow<string>('FRONTEND_URL').replace(/\/$/, ''), ...extra];
  }

  callbackFor(origin: string | undefined): string | undefined {
    const index = origin ? this.origins.indexOf(origin.replace(/\/$/, '')) : -1;
    return index > 0 ? `${this.origins[index]}/api/payments/callback/${index}` : undefined;
  }

  frontendFor(index: number): string {
    return this.origins[index] ?? this.origins[0];
  }
}
