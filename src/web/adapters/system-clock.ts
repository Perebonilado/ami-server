import type { ClockPort } from '../../business/ports/clock.port.js';

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }
}
