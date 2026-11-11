import { IsInt, Matches, Max, Min } from 'class-validator';

export class BankAccountDto {
  @Matches(/^\d{3,6}$/, { message: 'Choose a bank from the list.' })
  bankCode: string;

  @Matches(/^\d{10}$/, { message: 'Account numbers have 10 digits.' })
  accountNumber: string;
}

export class RequestPayoutDto {
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  amountKobo: number;
}
