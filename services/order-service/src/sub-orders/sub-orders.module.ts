import { Module } from '@nestjs/common';
import { SubOrdersService } from './sub-orders.service';
import { SubOrdersController } from './sub-orders.controller';
import { VendorOrdersController } from './vendor-orders.controller';

@Module({
  controllers: [SubOrdersController, VendorOrdersController],
  providers: [SubOrdersService],
  exports: [SubOrdersService],
})
export class SubOrdersModule {}
