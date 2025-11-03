import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private config: ConfigService) {
    const secretKey = this.config.get('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-10-29.clover',
      });
      this.logger.log('Stripe initialized successfully');
    } else {
      this.logger.warn('Stripe secret key not configured');
    }
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    orderId: string;
    customerId?: string;
    metadata?: any;
  }) {
    const { amount, currency, orderId, customerId, metadata } = params;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        ...metadata,
      },
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  }

  async confirmPaymentIntent(intentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(intentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
    };
  }

  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }) {
    const { paymentIntentId, amount, reason } = params;

    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason as any,
    });

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
    };
  }

  async createCustomer(params: {
    email: string;
    name: string;
    phone?: string;
  }) {
    const { email, name, phone } = params;

    const customer = await this.stripe.customers.create({
      email,
      name,
      phone,
    });

    return {
      customerId: customer.id,
      email: customer.email,
    };
  }

  async saveCard(params: {
    customerId: string;
    paymentMethodId: string;
  }) {
    const { customerId, paymentMethodId } = params;

    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const paymentMethod = await this.stripe.paymentMethods.retrieve(
      paymentMethodId,
    );

    return {
      cardId: paymentMethod.id,
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
      expMonth: paymentMethod.card?.exp_month,
      expYear: paymentMethod.card?.exp_year,
    };
  }

  async listCustomerCards(customerId: string) {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data.map((pm) => ({
      cardId: pm.id,
      last4: pm.card?.last4,
      brand: pm.card?.brand,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
    }));
  }

  async deleteCard(paymentMethodId: string) {
    await this.stripe.paymentMethods.detach(paymentMethodId);
    return { success: true };
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): any {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error.message);
      throw error;
    }
  }
}
