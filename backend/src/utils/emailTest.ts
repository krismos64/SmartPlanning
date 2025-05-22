/**
 * Service d'envoi d'emails alternatif pour test
 *
 * Utilise une configuration plus standard pour le débogage
 */

import nodemailer from "nodemailer";

// Configuration d'un transporteur d'email de test
export const createTestTransporter = () => {
  // Utiliser le service de test intégré à Nodemailer qui permet
  // de générer un compte de test éphémère sur Ethereal
  return new Promise((resolve, reject) => {
    nodemailer
      .createTestAccount()
      .then((testAccount) => {
        console.log("📧 Compte de test Ethereal créé:", testAccount.user);

        // Créer un transporteur avec le compte de test
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false, // true pour 465, false pour les autres ports
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        resolve({
          transporter,
          previewUrl: (id: string) => `https://ethereal.email/message/${id}`,
          user: testAccount.user,
          pass: testAccount.pass,
        });
      })
      .catch((error) => {
        console.error("Erreur lors de la création du compte de test:", error);
        reject(error);
      });
  });
};

/**
 * Envoyer un email avec le transporteur de test
 * @param to - Adresse email du destinataire
 * @param subject - Sujet de l'email
 * @param html - Contenu HTML de l'email
 * @returns Promise avec l'URL de prévisualisation de l'email
 */
export const sendTestEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<string> => {
  try {
    const testAccount: any = await createTestTransporter();

    console.log(`📧 Tentative d'envoi d'email à ${to} via Ethereal`);

    const info = await testAccount.transporter.sendMail({
      from: `"SmartPlanning Test" <${testAccount.user}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email envoyé: ${info.messageId}`);
    console.log(
      `📧 URL de prévisualisation: ${testAccount.previewUrl(info.messageId)}`
    );

    // Retourner l'URL de prévisualisation
    return testAccount.previewUrl(info.messageId);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de test:", error);
    throw error;
  }
};

export default {
  createTestTransporter,
  sendTestEmail,
};
