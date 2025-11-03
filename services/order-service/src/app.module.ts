import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { OrdersModule } from './orders/orders.module';
import { SubOrdersModule } from './sub-orders/sub-orders.module';
import { AdminOrdersModule } from './admin/admin-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    OrdersModule,
    SubOrdersModule,
    AdminOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  })
export class AppModule {}
