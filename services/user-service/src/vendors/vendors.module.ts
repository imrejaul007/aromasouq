import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorDocumentsService } from './vendor-documents.service';
import { VendorsController } from './vendors.controller';
import { AdminVendorsController } from './admin-vendors.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VendorsController, AdminVendorsController],
  providers: [VendorsService, VendorDocumentsService],
  exports: [VendorsService, VendorDocumentsService],
})
export class VendorsModule {}
