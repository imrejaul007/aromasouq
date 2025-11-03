import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RewardsIntegrationService } from './rewards-integration.service';

@Module({
  imports: [HttpModule],
  providers: [RewardsIntegrationService],
  exports: [RewardsIntegrationService],
})
export class RewardsIntegrationModule {}
