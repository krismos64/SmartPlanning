/**
 * Service d'envoi d'emails
 *
 * Ce fichier contient les fonctions pour envoyer des emails avec nodemailer
 */

import nodemailer from "nodemailer";

// Configuration du transporteur d'email avec les variables d'environnement
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_PORT === "465", // true pour le port 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER || "contact@smartplanning.fr",
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Ne pas échouer en cas de certificat non valide
    rejectUnauthorized: false,
  },
});

/**
 * Envoyer un email
 * @param to - Adresse email du destinataire
 * @param subject - Sujet de l'email
 * @param html - Contenu HTML de l'email
 * @returns Promise<boolean> - True si l'email est envoyé avec succès
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    console.log(`📧 Tentative d'envoi d'email à ${to}`);
    const info = await transporter.sendMail({
      from: `"SmartPlanning" <${
        process.env.SMTP_USER || "contact@smartplanning.fr"
      }>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email envoyé: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return false;
  }
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 * @param to - Adresse email du destinataire
 * @param resetLink - Lien de réinitialisation avec token
 * @returns Promise<boolean> - True si l'email est envoyé avec succès
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetLink: string,
  firstName?: string
): Promise<boolean> => {
  const subject = "Réinitialisation de votre mot de passe SmartPlanning";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5;">SmartPlanning</h1>
      </div>
      <p>Bonjour${firstName ? " " + firstName : ""},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte SmartPlanning.</p>
      <p>Veuillez cliquer sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
      </div>
      <p>Ce lien est valable pendant 1 heure. Après cette période, vous devrez faire une nouvelle demande de réinitialisation.</p>
      <p>Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet email.</p>
      <p>Cordialement,<br>L'équipe SmartPlanning</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        <p>© ${new Date().getFullYear()} SmartPlanning. Tous droits réservés.</p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
};

export default {
  sendEmail,
  sendPasswordResetEmail,
};
