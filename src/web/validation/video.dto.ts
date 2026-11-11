import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { CATEGORIES, VideoStatus } from '../../business/domain/values/enums.js';

export class VideoSearchDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;
}

export class CreateVideoDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsIn(CATEGORIES, { message: 'Pick a category.' })
  category: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];

  @IsInt()
  @Min(100_000, { message: 'Set a price of at least ₦1,000.' })
  @Max(1_000_000_000)
  basePriceKobo: number;

  @IsBoolean()
  rightsConfirmed: boolean;

  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsInt()
  @Min(1)
  fileSizeBytes: number;

  @Matches(/^[a-f0-9]{64}$/i, { message: 'Add a video file.' })
  fileSha256: string;

  @IsNumber()
  @Min(0.1)
  @Max(3600)
  durationSec: number;

  @IsOptional()
  @ValidateIf((_dto, value) => value !== null)
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, { message: 'The thumbnail must be an image.' })
  @MaxLength(400_000, { message: 'The thumbnail is too large.' })
  thumbnailDataUrl?: string | null;
}

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn([VideoStatus.LIVE, VideoStatus.HIDDEN])
  status?: VideoStatus.LIVE | VideoStatus.HIDDEN;

  @IsOptional()
  @IsInt()
  @Min(100_000, { message: 'Set a price of at least ₦1,000.' })
  @Max(1_000_000_000)
  basePriceKobo?: number;
}
