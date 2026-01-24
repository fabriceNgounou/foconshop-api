import { IsString } from 'class-validator';

export class CreateTrackingEventDto {
  @IsString()
  label: string;
}
