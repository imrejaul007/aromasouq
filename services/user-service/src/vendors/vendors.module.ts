import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorDocumentsService } from './vendor-documents.service';
import { VendorPayoutsService } from './vendor-payouts.service';
import { VendorsController } from './vendors.controller';
import { AdminVendorsController } from './admin-vendors.controller';
import { VendorPayoutsController } from './vendor-payouts.controller';
import { AdminPayoutsController } from './admin-payouts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    VendorsController,
    AdminVendorsController,
    VendorPayoutsController,
    AdminPayoutsController,
  ],
  providers: [VendorsService, VendorDocumentsService, VendorPayoutsService],
  exports: [VendorsService, VendorDocumentsService, VendorPayoutsService],
})
export class VendorsModule {}
