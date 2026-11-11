import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { LicenceDuration } from '../../business/domain/values/enums.js';

export class PartDto {
  @IsInt()
  @Min(0)
  startSec: number;

  @IsInt()
  @Min(1)
  endSec: number;
}

export class CheckoutDto {
  @IsUUID()
  videoId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartDto)
  part?: PartDto | null;

  @IsEnum(LicenceDuration, { message: 'Choose how long you need the licence.' })
  duration: LicenceDuration;
}

export class SimulatePaymentDto {
  @IsIn(['paid', 'failed'])
  outcome: 'paid' | 'failed';
}

export class PaymentCallbackDto {
  @IsString()
  @MaxLength(40)
  reference: string;

  @IsOptional()
  @IsString()
  status?: string;
}
