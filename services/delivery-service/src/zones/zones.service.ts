import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZoneType } from '@prisma/client';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    code: string;
    type: ZoneType;
    country: string;
    city?: string;
    district?: string;
    postalCodes?: string[];
    standardAvailable?: boolean;
    expressAvailable?: boolean;
    sameDayAvailable?: boolean;
    standardDays?: number;
    expressDays?: number;
    pricingMultiplier?: number;
    coordinates?: any;
  }) {
    return this.prisma.deliveryZone.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        country: data.country,
        city: data.city,
        district: data.district,
        postalCodes: data.postalCodes || [],
        standardAvailable: data.standardAvailable ?? true,
        expressAvailable: data.expressAvailable ?? false,
        sameDayAvailable: data.sameDayAvailable ?? false,
        standardDays: data.standardDays || 3,
        expressDays: data.expressDays || 1,
        pricingMultiplier: data.pricingMultiplier || 1.0,
        coordinates: data.coordinates,
        isActive: true,
      },
    });
  }

  async findAll(options: {
    country?: string;
    city?: string;
    type?: ZoneType;
    isActive?: boolean;
  } = {}) {
    const where: any = {};
    if (options.country) where.country = options.country;
    if (options.city) where.city = options.city;
    if (options.type) where.type = options.type;
    if (options.isActive !== undefined) where.isActive = options.isActive;

    return this.prisma.deliveryZone.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const zone = await this.prisma.deliveryZone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException('Delivery zone not found');
    }

    return zone;
  }

  async findByCode(code: string) {
    const zone = await this.prisma.deliveryZone.findUnique({
      where: { code },
    });

    if (!zone) {
      throw new NotFoundException('Delivery zone not found');
    }

    return zone;
  }

  async update(id: string, data: any) {
    const zone = await this.findOne(id);

    return this.prisma.deliveryZone.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const zone = await this.findOne(id);

    return this.prisma.deliveryZone.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async calculateRate(params: {
    fromCountry: string;
    fromCity: string;
    toCountry: string;
    toCity: string;
    weight: number;
    baseRate: number;
  }) {
    // Find the delivery zone for the destination
    const zone = await this.prisma.deliveryZone.findFirst({
      where: {
        country: params.toCountry,
        city: params.toCity,
        isActive: true,
      },
    });

    if (!zone) {
      // Return default rate if no zone found
      return {
        rate: params.baseRate,
        multiplier: 1.0,
        standardDays: 3,
        expressDays: 1,
        standardAvailable: true,
        expressAvailable: false,
        sameDayAvailable: false,
      };
    }

    const multiplier = zone.pricingMultiplier.toNumber();
    const rate = params.baseRate * multiplier;

    return {
      rate,
      multiplier,
      standardDays: zone.standardDays,
      expressDays: zone.expressDays,
      standardAvailable: zone.standardAvailable,
      expressAvailable: zone.expressAvailable,
      sameDayAvailable: zone.sameDayAvailable,
      zone: {
        id: zone.id,
        name: zone.name,
        code: zone.code,
      },
    };
  }

  async checkServiceAvailability(params: {
    toCountry: string;
    toCity: string;
    deliveryType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
  }) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: {
        country: params.toCountry,
        city: params.toCity,
        isActive: true,
      },
    });

    if (!zone) {
      return {
        available: false,
        reason: 'Service not available in this area',
      };
    }

    let available = false;
    if (params.deliveryType === 'STANDARD') {
      available = zone.standardAvailable;
    } else if (params.deliveryType === 'EXPRESS') {
      available = zone.expressAvailable;
    } else if (params.deliveryType === 'SAME_DAY') {
      available = zone.sameDayAvailable;
    }

    return {
      available,
      zone: {
        id: zone.id,
        name: zone.name,
        code: zone.code,
      },
    };
  }
}
