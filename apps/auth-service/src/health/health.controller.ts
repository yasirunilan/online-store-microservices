import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({ version: VERSION_NEUTRAL, path: 'health' })
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME ?? 'auth-service',
      timestamp: new Date().toISOString(),
    };
  }
}
