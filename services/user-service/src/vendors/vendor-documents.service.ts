import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorDocumentType, DocumentVerificationStatus } from '@prisma/client';

@Injectable()
export class VendorDocumentsService {
  constructor(private prisma: PrismaService) {}

  // ==================== VENDOR DOCUMENT MANAGEMENT ====================

  async uploadDocument(vendorId: string, data: {
    type: VendorDocumentType;
    documentUrl: string;
    documentNumber?: string;
    expiryDate?: Date;
  }) {
    // Verify vendor exists
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Check if document of this type already exists and is approved
    const existingDoc = await this.prisma.vendorDocument.findFirst({
      where: {
        vendorId,
        type: data.type,
        status: DocumentVerificationStatus.APPROVED,
      },
    });

    if (existingDoc) {
      throw new BadRequestException(
        `Approved ${data.type} document already exists. Please contact admin to update.`,
      );
    }

    // Create document
    const document = await this.prisma.vendorDocument.create({
      data: {
        vendorId,
        type: data.type,
        documentUrl: data.documentUrl,
        documentNumber: data.documentNumber,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: DocumentVerificationStatus.PENDING,
      },
    });

    return {
      ...document,
      message: 'Document uploaded successfully. Awaiting admin verification.',
    };
  }

  async getDocuments(vendorId: string) {
    const documents = await this.prisma.vendorDocument.findMany({
      where: { vendorId },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents;
  }

  async getDocumentById(vendorId: string, documentId: string) {
    const document = await this.prisma.vendorDocument.findFirst({
      where: {
        id: documentId,
        vendorId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async deleteDocument(vendorId: string, documentId: string) {
    const document = await this.getDocumentById(vendorId, documentId);

    // Cannot delete approved documents
    if (document.status === DocumentVerificationStatus.APPROVED) {
      throw new ForbiddenException('Cannot delete approved documents. Contact admin for assistance.');
    }

    await this.prisma.vendorDocument.delete({
      where: { id: documentId },
    });

    return { message: 'Document deleted successfully' };
  }

  // ==================== ADMIN - DOCUMENT VERIFICATION ====================

  async approveDocument(documentId: string, adminId: string) {
    const document = await this.prisma.vendorDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status === DocumentVerificationStatus.APPROVED) {
      throw new BadRequestException('Document is already approved');
    }

    // Check expiry date if exists
    if (document.expiryDate && new Date(document.expiryDate) < new Date()) {
      throw new BadRequestException('Cannot approve expired document');
    }

    const updated = await this.prisma.vendorDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentVerificationStatus.APPROVED,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        rejectionReason: null,
      },
    });

    // TODO: Send notification to vendor about document approval

    return {
      ...updated,
      message: 'Document approved successfully',
    };
  }

  async rejectDocument(documentId: string, adminId: string, reason: string) {
    const document = await this.prisma.vendorDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updated = await this.prisma.vendorDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentVerificationStatus.REJECTED,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        rejectionReason: reason,
      },
    });

    // TODO: Send notification to vendor about document rejection

    return {
      ...updated,
      message: 'Document rejected',
    };
  }

  async getPendingDocuments() {
    const documents = await this.prisma.vendorDocument.findMany({
      where: { status: DocumentVerificationStatus.PENDING },
      orderBy: { uploadedAt: 'asc' },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            brandName: true,
            businessEmail: true,
          },
        },
      },
    });

    return documents;
  }

  async getExpiringDocuments(daysThreshold: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    const documents = await this.prisma.vendorDocument.findMany({
      where: {
        status: DocumentVerificationStatus.APPROVED,
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      orderBy: { expiryDate: 'asc' },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            brandName: true,
            businessEmail: true,
          },
        },
      },
    });

    return documents;
  }

  async getExpiredDocuments() {
    const documents = await this.prisma.vendorDocument.findMany({
      where: {
        status: DocumentVerificationStatus.APPROVED,
        expiryDate: {
          lt: new Date(),
        },
      },
      orderBy: { expiryDate: 'asc' },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            brandName: true,
            businessEmail: true,
          },
        },
      },
    });

    return documents;
  }

  // ==================== VALIDATION ====================

  async getVerificationStatus(vendorId: string) {
    const documents = await this.getDocuments(vendorId);

    const requiredDocs = [
      VendorDocumentType.TRADE_LICENSE,
      VendorDocumentType.TAX_REGISTRATION,
      VendorDocumentType.ID_CARD,
    ];

    const status = {
      [VendorDocumentType.TRADE_LICENSE]: false,
      [VendorDocumentType.TAX_REGISTRATION]: false,
      [VendorDocumentType.ID_CARD]: false,
      [VendorDocumentType.BANK_STATEMENT]: false,
      [VendorDocumentType.BRAND_AUTHORIZATION]: false,
    };

    const details: any = {};

    documents.forEach((doc) => {
      if (doc.status === DocumentVerificationStatus.APPROVED) {
        status[doc.type] = true;
      }
      details[doc.type] = {
        uploaded: true,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        verifiedAt: doc.verifiedAt,
        rejectionReason: doc.rejectionReason,
        expiryDate: doc.expiryDate,
      };
    });

    const allRequiredApproved = requiredDocs.every((type) => status[type]);

    return {
      allRequiredApproved,
      status,
      details,
      missingRequired: requiredDocs.filter((type) => !status[type]),
    };
  }
}
