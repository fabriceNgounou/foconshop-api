import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendOtpEmail(email: string, otpCode: string) {
    try {
      await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>', // Vous pouvez utiliser votre domaine
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
    } catch (error) {
      console.error('❌ Erreur envoi email OTP:', error);
      throw error;
    }
  }

  async sendPasswordResetOtp(email: string, otpCode: string) {
    try {
      await this.resend.emails.send({
        from: 'FoconShop <noreply@foconshop.com>',
        to: email,
        subject: 'Réinitialisation de mot de passe',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
              <h2 style="color: #333; margin-top: 0;">Réinitialisation de mot de passe</h2>
              <p style="color: #666; font-size: 16px;">
                Vous avez demandé la réinitialisation de votre mot de passe.
              </p>
              <p style="color: #666; font-size: 16px;">
                Votre code de vérification est :
              </p>
              <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h1 style="color: #FF5722; font-size: 36px; letter-spacing: 8px; margin: 0;">${otpCode}</h1>
              </div>
              <p style="color: #666; font-size: 14px;">
                ⏱️ Ce code expire dans <strong>10 minutes</strong>.
              </p>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  ⚠️ <strong>Attention :</strong> Si vous n'avez pas demandé cette réinitialisation, 
                  ignorez cet email et votre mot de passe restera inchangé.
                </p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('❌ Erreur envoi email reset:', error);
      throw error;
    }
  }

  async sendPasswordResetConfirmation(email: string) {
    try {
      await this.resend.emails.send({
        from: 'FoconShop <noreply@foconshop.com>',
        to: email,
        subject: 'Mot de passe modifié avec succès',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
              <h2 style="color: #333; margin-top: 0;">✅ Mot de passe modifié</h2>
              <p style="color: #666; font-size: 16px;">
                Votre mot de passe a été modifié avec succès.
              </p>
              <p style="color: #666; font-size: 16px;">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-top: 20px; border-radius: 4px;">
                <p style="color: #155724; margin: 0; font-size: 14px;">
                  🔒 <strong>Sécurité :</strong> Si vous n'êtes pas à l'origine de ce changement, 
                  contactez immédiatement notre support.
                </p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('❌ Erreur envoi confirmation:', error);
      throw error;
    }
  }
}