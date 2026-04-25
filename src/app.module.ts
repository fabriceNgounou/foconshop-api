import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { VendorModule } from './vendor/vendor.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { MediaModule } from './media/media.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { AddressModule } from './address/address.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { ReferralModule } from './referal/referral.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReturnsModule } from './returns/returns.module';
import { DisputeModule } from './disputes/disputes.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { MetricsModule } from './admin/metrics/metrics.module';
import { AdminVendorModule } from './admin/admin-vendor/admin-vendor.module';
import { AdminOrderModule } from './admin/admin-order/admin-order.module';
import { AdminModule } from './admin/admin.module';
import { InvoiceModule } from './invoice/invoice.module';
import { AdminInvoicesModule } from './admin/invoices/admin-invoices.module';
import { SocialProofModule } from './social-proof/social-proof.module';
import { PromotionModule } from './promotion/promotion.module';
import { NotificationModule } from './notifications/notification.module';
import {ReviewsModule} from './review/review.module';
import {ScheduleModule} from "@nestjs/schedule";
import { AdminCouponsModule } from './admin/coupons/admin-coupons.module';
import { AdminLoyaltyModule } from './admin/loyalty/admin-loyalty.module';
import { AdminReferralsModule } from './admin/referrals/admin-referrals.module';
import { AdminNotificationsModule } from './admin/notifications/admin-notifications.module';



@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
     ScheduleModule.forRoot(),
     PrismaModule,
     AuthModule,
     ProductModule,
     VendorModule,
    CategoryModule,
     ProductVariantModule,
    MediaModule,
    CartModule,
    CheckoutModule,
    AddressModule,
    OrdersModule,
    PaymentsModule,
    ShipmentsModule,
    LoyaltyModule,
    ReferralModule,
    CouponsModule,
    ReturnsModule,
    DisputeModule,
    ResolutionsModule,
    MetricsModule,
    AdminVendorModule,
    AdminOrderModule,
    AdminModule,
    InvoiceModule,
    AdminInvoicesModule,
    SocialProofModule,
    PromotionModule,
    NotificationModule,
    ReviewsModule,
    AdminCouponsModule,
    AdminLoyaltyModule,
    AdminReferralsModule,
    AdminNotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService,],
})
export class AppModule {}
