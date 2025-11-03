import { Module } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CashbackService } from './cashback.service';
import { CampaignsService } from './campaigns.service';
import { RewardsController } from './rewards.controller';
import { CashbackController } from './cashback.controller';
import { CampaignsController } from './campaigns.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RewardsController, CashbackController, CampaignsController],
  providers: [RewardsService, CashbackService, CampaignsService],
  exports: [RewardsService, CashbackService, CampaignsService],
})
export class RewardsModule {}
