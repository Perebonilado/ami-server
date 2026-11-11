export class RateBudget {
  private readonly calls: number[] = [];

  constructor(private readonly perMinute: number) {}

  take(now = Date.now()): boolean {
    while (this.calls.length && now - this.calls[0] >= 60_000) this.calls.shift();
    if (this.calls.length >= this.perMinute) return false;
    this.calls.push(now);
    return true;
  }
}
