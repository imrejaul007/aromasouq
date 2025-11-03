import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { CouriersModule } from './couriers/couriers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ShipmentsModule,
    CouriersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
