import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class RedeemCashbackDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1000) // Minimum 10 AED (1000 Fils)
  amount: number; // In Fils
}
