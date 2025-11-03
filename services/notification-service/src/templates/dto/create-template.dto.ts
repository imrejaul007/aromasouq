import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  emailSubject?: string;

  @IsString()
  @IsOptional()
  emailBody?: string;

  @IsString()
  @IsOptional()
  emailHtml?: string;

  @IsString()
  @IsOptional()
  smsBody?: string;

  @IsString()
  @IsOptional()
  pushTitle?: string;

  @IsString()
  @IsOptional()
  pushBody?: string;

  @IsOptional()
  pushData?: any;

  @IsArray()
  @IsString({ each: true })
  variables: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
