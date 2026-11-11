import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { VideoStatus } from '../../business/domain/values/enums.js';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsBoolean()
  suspended?: boolean;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class AdminUpdateVideoDto {
  @IsEnum(VideoStatus)
  status: VideoStatus;
}
