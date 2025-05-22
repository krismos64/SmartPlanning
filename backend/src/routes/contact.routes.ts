/**
 * Routes pour le formulaire de contact
 *
 * Ce fichier gère les routes pour envoyer des messages de contact
 */

import { Request, Response, Router } from "express";
import { sendEmail } from "../utils/email";

const router = Router();

/**
 * @route POST /api/contact
 * @desc Envoyer un message de contact
 * @access Public
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Validation de l'email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Format d'email invalide" });
    }

    // Préparation du contenu de l'email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5;">SmartPlanning - Message de contact</h1>
        </div>
        <p><strong>De:</strong> ${firstName} ${lastName} (${email})</p>
        <p><strong>Téléphone:</strong> ${phone || "Non renseigné"}</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
        <p>Ce message a été envoyé via le formulaire de contact de SmartPlanning.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} SmartPlanning. Tous droits réservés.</p>
        </div>
      </div>
    `;

    // Envoi de l'email
    const emailSent = await sendEmail(
      "contact@smartplanning.fr", // Adresse email destinataire fixe
      `[Contact SmartPlanning] ${subject}`,
      html
    );

    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: "Votre message a été envoyé avec succès",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Échec de l'envoi du message, veuillez réessayer plus tard",
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi du message de contact:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue, veuillez réessayer plus tard",
    });
  }
});

export default router;
