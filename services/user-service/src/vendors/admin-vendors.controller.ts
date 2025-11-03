import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorDocumentsService } from './vendor-documents.service';
import {
  VendorQueryDto,
  UpdateCommissionDto,
  VerifyVendorDto,
  RejectVendorDto,
  RequestResubmissionDto,
  SuspendVendorDto,
  UnsuspendVendorDto,
  ApproveDocumentDto,
  RejectDocumentDto,
} from './dto';

// Note: Import these guards from your auth module
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/vendors')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN', 'SUPER_ADMIN')
export class AdminVendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly documentsService: VendorDocumentsService,
  ) {}

  // ==================== VENDOR MANAGEMENT ====================

  @Get()
  async getAllVendors(@Query() query: VendorQueryDto) {
    return this.vendorsService.getAllVendors({
      verificationStatus: query.verificationStatus,
      isActive: query.isActive,
      isFeatured: query.isFeatured,
      businessType: query.businessType,
      search: query.search,
      page: query.page || 1,
      limit: query.limit || 20,
    });
  }

  @Get('stats')
  async getPlatformStats() {
    return this.vendorsService.getPlatformStats();
  }

  @Get(':id')
  async getVendorById(@Param('id') vendorId: string) {
    return this.vendorsService.getVendorById(vendorId);
  }

  @Get(':id/stats')
  async getVendorStats(@Param('id') vendorId: string) {
    return this.vendorsService.getVendorStats(vendorId);
  }

  // ==================== VENDOR VERIFICATION ====================

  @Patch(':id/verify')
  async verifyVendor(@Param('id') vendorId: string, @Body() dto: VerifyVendorDto) {
    return this.vendorsService.verifyVendor(vendorId, dto.adminId);
  }

  @Patch(':id/reject')
  async rejectVendor(@Param('id') vendorId: string, @Body() dto: RejectVendorDto) {
    return this.vendorsService.rejectVendor(vendorId, dto.adminId, dto.reason);
  }

  @Patch(':id/resubmit')
  async requestResubmission(
    @Param('id') vendorId: string,
    @Body() dto: RequestResubmissionDto,
  ) {
    return this.vendorsService.requestResubmission(vendorId, dto.adminId, dto.message);
  }

  // ==================== VENDOR STATUS MANAGEMENT ====================

  @Patch(':id/suspend')
  async suspendVendor(@Param('id') vendorId: string, @Body() dto: SuspendVendorDto) {
    return this.vendorsService.suspendVendor(vendorId, dto.adminId, dto.reason);
  }

  @Patch(':id/unsuspend')
  async unsuspendVendor(@Param('id') vendorId: string, @Body() dto: UnsuspendVendorDto) {
    return this.vendorsService.unsuspendVendor(vendorId, dto.adminId);
  }

  @Patch(':id/commission')
  async updateCommission(
    @Param('id') vendorId: string,
    @Body() dto: UpdateCommissionDto,
  ) {
    return this.vendorsService.updateCommission(vendorId, dto.commissionRate);
  }

  @Patch(':id/featured')
  async toggleFeatured(@Param('id') vendorId: string) {
    return this.vendorsService.toggleFeatured(vendorId);
  }

  // ==================== DOCUMENT VERIFICATION ====================

  @Get('documents/pending')
  async getPendingDocuments() {
    return this.documentsService.getPendingDocuments();
  }

  @Get('documents/expiring')
  async getExpiringDocuments(@Query('days') days?: string) {
    const daysThreshold = days ? parseInt(days, 10) : 30;
    return this.documentsService.getExpiringDocuments(daysThreshold);
  }

  @Get('documents/expired')
  async getExpiredDocuments() {
    return this.documentsService.getExpiredDocuments();
  }

  @Patch('documents/:id/approve')
  async approveDocument(@Param('id') documentId: string, @Body() dto: ApproveDocumentDto) {
    return this.documentsService.approveDocument(documentId, dto.adminId);
  }

  @Patch('documents/:id/reject')
  async rejectDocument(@Param('id') documentId: string, @Body() dto: RejectDocumentDto) {
    return this.documentsService.rejectDocument(documentId, dto.adminId, dto.reason);
  }
}
