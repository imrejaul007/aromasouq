import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RewardsSchedulerService } from './rewards-scheduler.service';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [ScheduleModule.forRoot(), RewardsModule],
  providers: [RewardsSchedulerService],
  exports: [RewardsSchedulerService],
})
export class SchedulerModule {}
