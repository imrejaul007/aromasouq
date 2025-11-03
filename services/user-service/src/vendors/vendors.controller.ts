import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorDocumentsService } from './vendor-documents.service';
import {
  RegisterVendorDto,
  UpdateVendorDto,
  UploadDocumentDto,
} from './dto';

// Note: Import these guards from your auth module
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vendors')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('VENDOR')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly documentsService: VendorDocumentsService,
  ) {}

  // ==================== VENDOR REGISTRATION ====================

  @Post('register')
  async register(@Request() req: any, @Body() dto: RegisterVendorDto) {
    // Extract userId from JWT token: req.user.id
    const userId = req.user?.id || 'mock-user-id'; // TODO: Replace with actual JWT userId
    return this.vendorsService.register(userId, dto);
  }

  // ==================== VENDOR PROFILE ====================

  @Get('profile')
  async getProfile(@Request() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    return this.vendorsService.getProfile(userId);
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateVendorDto) {
    const userId = req.user?.id || 'mock-user-id';
    return this.vendorsService.updateProfile(userId, dto);
  }

  @Get('stats')
  async getVendorStats(@Request() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    const vendor = await this.vendorsService.getProfile(userId);
    return this.vendorsService.getVendorStats(vendor.id);
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  @Post('documents')
  async uploadDocument(@Request() req: any, @Body() dto: UploadDocumentDto) {
    const userId = req.user?.id || 'mock-user-id';
    const vendor = await this.vendorsService.getProfile(userId);

    return this.documentsService.uploadDocument(vendor.id, {
      type: dto.type,
      documentUrl: dto.documentUrl,
      documentNumber: dto.documentNumber,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    });
  }

  @Get('documents')
  async getDocuments(@Request() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    const vendor = await this.vendorsService.getProfile(userId);
    return this.documentsService.getDocuments(vendor.id);
  }

  @Get('documents/:id')
  async getDocumentById(@Request() req: any, @Param('id') documentId: string) {
    const userId = req.user?.id || 'mock-user-id';
    const vendor = await this.vendorsService.getProfile(userId);
    return this.documentsService.getDocumentById(vendor.id, documentId);
  }

  @Delete('documents/:id')
  async deleteDocument(@Request() req: any, @Param('id') documentId: string) {
    const userId = req.user?.id || 'mock-user-id';
    const vendor = await this.vendorsService.getProfile(userId);
    return this.documentsService.deleteDocument(vendor.id, documentId);
  }

  @Get('documents/status/verification')
  async getVerificationStatus(@Request() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    const vendor = await this.vendorsService.getProfile(userId);
    return this.documentsService.getVerificationStatus(vendor.id);
  }
}
