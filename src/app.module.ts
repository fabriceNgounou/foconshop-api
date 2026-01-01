import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { VendorModule } from './vendor/vendor.module';
import { PrismaService } from './prisma/prisma.service';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { MediaModule } from './media/media.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { AddressModule } from './address/address.module';
import { OrdersModule } from './orders/orders.moule';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule,
     ProductModule,
     VendorModule,
    CategoryModule,
     ProductVariantModule,
    MediaModule,
    CartModule,
    CheckoutModule,
    AddressModule,
    OrdersModule,],
  controllers: [AppController],
  providers: [AppService,PrismaService],
})
export class AppModule {}
