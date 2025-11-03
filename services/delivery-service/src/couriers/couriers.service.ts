import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouriersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.courier.findMany({
      where: { status: 'ACTIVE' },
      include: {
        rateCards: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.courier.findUnique({
      where: { id },
      include: {
        rateCards: true,
      },
    });
  }

  async getRate(params: {
    courierId: string;
    weight: number;
    fromCountry?: string;
    toCountry?: string;
  }) {
    const courier = await this.prisma.courier.findUnique({
      where: { id: params.courierId },
    });

    if (!courier) {
      return null;
    }

    // Simple rate calculation (would integrate with courier APIs in production)
    const baseRate = courier.baseFee.toNumber();
    const weightCharge = params.weight * courier.perKgRate.toNumber();
    const total = baseRate + weightCharge;

    return {
      courierId: params.courierId,
      rate: total,
      currency: 'AED',
      estimatedDays: courier.standardDeliveryDays,
    };
  }
}
