import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  CreateRefundDto,
} from './dto/create-payment.dto';
import { PaymentProvider, PaymentStatus, TransactionType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    const { orderId, userId, amount, currency = 'AED', provider, metadata } = dto;

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    let intentData: any;

    // Create payment intent with provider
    if (provider === PaymentProvider.STRIPE) {
      intentData = await this.stripeService.createPaymentIntent({
        amount,
        currency,
        orderId,
        metadata,
      });
    } else if (provider === PaymentProvider.TELR) {
      // Telr integration would go here
      throw new BadRequestException('Telr integration coming soon');
    } else if (provider === PaymentProvider.PAYTABS) {
      // PayTabs integration would go here
      throw new BadRequestException('PayTabs integration coming soon');
    } else {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    // Create payment intent record
    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        intentId: intentData.intentId,
        orderId,
        userId,
        amount,
        currency,
        provider,
        status: PaymentStatus.PENDING,
        clientSecret: intentData.clientSecret,
        requiresAction: intentData.status === 'requires_action',
        metadata,
      },
    });

    this.logger.log(`Payment intent created: ${paymentIntent.id} for order ${orderId}`);

    return {
      id: paymentIntent.id,
      intentId: paymentIntent.intentId,
      clientSecret: paymentIntent.clientSecret,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  async confirmPayment(dto: ConfirmPaymentDto) {
    const { intentId, paymentMethodId } = dto;

    // Find payment intent
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { intentId },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    // Confirm with provider
    let confirmedData: any;

    if (paymentIntent.provider === PaymentProvider.STRIPE) {
      confirmedData = await this.stripeService.confirmPaymentIntent(intentId);
    }

    // Update payment intent status
    const status =
      confirmedData.status === 'succeeded'
        ? PaymentStatus.COMPLETED
        : confirmedData.status === 'requires_action'
        ? PaymentStatus.REQUIRES_ACTION
        : PaymentStatus.FAILED;

    await this.prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: {
        status,
        confirmedAt: status === PaymentStatus.COMPLETED ? new Date() : null,
      },
    });

    // Create transaction record if successful
    if (status === PaymentStatus.COMPLETED) {
      await this.createTransaction({
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.orderId,
        userId: paymentIntent.userId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        provider: paymentIntent.provider,
        type: TransactionType.PAYMENT,
      });

      this.logger.log(`Payment completed for order ${paymentIntent.orderId}`);
    }

    return {
      id: paymentIntent.id,
      status,
      orderId: paymentIntent.orderId,
      amount: paymentIntent.amount,
    };
  }

  private async createTransaction(data: {
    paymentIntentId: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    provider: PaymentProvider;
    type: TransactionType;
  }) {
    return this.prisma.transaction.create({
      data: {
        paymentIntentId: data.paymentIntentId,
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
        provider: data.provider,
        type: data.type,
        status: PaymentStatus.COMPLETED,
      },
    });
  }

  async createRefund(dto: CreateRefundDto) {
    const { transactionId, amount, reason } = dto;

    // Find transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { paymentIntent: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.type !== TransactionType.PAYMENT) {
      throw new BadRequestException('Can only refund payment transactions');
    }

    // Check if already refunded
    const existingRefund = await this.prisma.refund.findFirst({
      where: { transactionId, status: PaymentStatus.COMPLETED },
    });

    if (existingRefund) {
      throw new BadRequestException('Transaction already refunded');
    }

    // Validate refund amount
    const refundAmount = amount || transaction.amount.toNumber();
    if (refundAmount > transaction.amount.toNumber()) {
      throw new BadRequestException('Refund amount exceeds transaction amount');
    }

    // Process refund with provider
    let refundData: any;

    if (transaction.provider === PaymentProvider.STRIPE) {
      refundData = await this.stripeService.createRefund({
        paymentIntentId: transaction.paymentIntent.intentId,
        amount: refundAmount,
        reason,
      });
    }

    // Create refund record
    const refund = await this.prisma.refund.create({
      data: {
        refundId: refundData.refundId,
        transactionId,
        orderId: transaction.orderId,
        userId: transaction.userId,
        amount: refundAmount,
        currency: transaction.currency,
        provider: transaction.provider,
        reason,
        status: PaymentStatus.COMPLETED,
        processedAt: new Date(),
      },
    });

    this.logger.log(`Refund created: ${refund.id} for transaction ${transactionId}`);

    return {
      id: refund.id,
      refundId: refund.refundId,
      amount: refund.amount,
      status: refund.status,
      orderId: refund.orderId,
    };
  }

  async getPaymentIntent(id: string) {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id },
      include: {
        transaction: true,
        refunds: true,
      },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    return paymentIntent;
  }

  async getTransactionsByOrder(orderId: string) {
    return this.prisma.transaction.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        refunds: true,
      },
    });
  }

  async getTransactionsByUser(userId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async processWebhook(provider: PaymentProvider, payload: any, signature: string) {
    this.logger.log(`Processing webhook from ${provider}`);

    if (provider === PaymentProvider.STRIPE) {
      const event = this.stripeService.verifyWebhookSignature(
        JSON.stringify(payload),
        signature,
      );

      await this.handleStripeWebhook(event);
    }

    return { received: true };
  }

  private async handleStripeWebhook(event: any) {
    const { type, data } = event;

    switch (type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(data.object);
        break;
      case 'charge.refunded':
        await this.handleRefundSuccess(data.object);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { intentId: paymentIntent.id },
    });

    if (intent && intent.status !== PaymentStatus.COMPLETED) {
      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: PaymentStatus.COMPLETED,
          confirmedAt: new Date(),
        },
      });

      this.logger.log(`Payment webhook processed: ${intent.id}`);
    }
  }

  private async handlePaymentFailure(paymentIntent: any) {
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { intentId: paymentIntent.id },
    });

    if (intent) {
      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: PaymentStatus.FAILED },
      });
    }
  }

  private async handleRefundSuccess(charge: any) {
    // Handle refund webhook
    this.logger.log(`Refund webhook received for charge: ${charge.id}`);
  }
}
