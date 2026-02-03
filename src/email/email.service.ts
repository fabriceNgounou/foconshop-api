import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendOtpEmail(email: string, otpCode: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Code de vérification - Inscription',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Bienvenue !</h2>
          <p>Votre code de vérification est :</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
          <p>Ce code expire dans 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        </div>
      `,
    });
  }
}