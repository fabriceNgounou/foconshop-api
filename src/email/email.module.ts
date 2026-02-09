import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // DEBUG: Vérifie ce qui est chargé
        console.log('🔍 MAIL_HOST:', config.get('MAIL_HOST'));
        console.log('🔍 MAIL_USER existe?:', !!config.get('MAIL_USER'));
        
        return {
          transport: {
            host: config.get('MAIL_HOST') || 'smtp.gmail.com', 
            port: parseInt(config.get('MAIL_PORT') || '587'), 
            secure: false,
            auth: {
              user: config.get('MAIL_USER') || 'russeldongmo96@gmail.com', 
              pass: config.get('MAIL_PASSWORD') || 'pydkkbceabemhvwr', 
            },
          },
          defaults: {
            from: `"No Reply" <${config.get('MAIL_FROM') || 'noreply@foconshop.com'}>`, 
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}