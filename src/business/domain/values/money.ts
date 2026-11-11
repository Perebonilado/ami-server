import BigNumber from 'bignumber.js';

export const Money = BigNumber.clone({
  DECIMAL_PLACES: 20,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
  EXPONENTIAL_AT: [-40, 40],
});

export type MoneyValue = BigNumber.Value;

export function money(value: MoneyValue): BigNumber {
  return new Money(value);
}

export function toKobo(value: MoneyValue): number {
  const kobo = new Money(value);
  if (!kobo.isFinite() || !kobo.isInteger() || kobo.abs().gt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`Invalid kobo amount: ${String(value)}`);
  }
  return kobo.toNumber();
}

export function nairaToKobo(naira: MoneyValue): number {
  return toKobo(new Money(naira).times(100).integerValue(BigNumber.ROUND_HALF_UP));
}

export function koboToNaira(kobo: MoneyValue): string {
  return new Money(kobo).dividedBy(100).toFixed(2);
}

export function sumKobo(values: MoneyValue[]): number {
  return toKobo(values.reduce<BigNumber>((total, value) => total.plus(value), new Money(0)));
}
