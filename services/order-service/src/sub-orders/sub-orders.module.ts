import { Module } from '@nestjs/common';
import { SubOrdersService } from './sub-orders.service';
import { SubOrdersController } from './sub-orders.controller';

@Module({
  controllers: [SubOrdersController],
  providers: [SubOrdersService],
  exports: [SubOrdersService],
})
export class SubOrdersModule {}
