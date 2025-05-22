/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { authenticateToken } from "../middlewares/auth.middleware";
import { uploadImageToCloudinary } from "../utils/cloudinary";

// Création du routeur Express
const router = express.Router();

// Configuration du stockage temporaire pour Multer
// Les fichiers uploadés seront stockés dans le dossier 'uploads'
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Définir le chemin du dossier d'upload
    const uploadDir = path.join(__dirname, "../../uploads");
    console.log("📁 Chemin du dossier d'upload:", uploadDir);

    // Créer le dossier s'il n'existe pas déjà
    if (!fs.existsSync(uploadDir)) {
      console.log("📁 Création du dossier d'upload car il n'existe pas");
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log("📁 Dossier d'upload créé avec succès");
      } catch (error) {
        console.error(
          "❌ Erreur lors de la création du dossier d'upload:",
          error
        );
      }
    } else {
      console.log("📁 Le dossier d'upload existe déjà");
      // Vérifier les permissions
      try {
        fs.accessSync(uploadDir, fs.constants.W_OK);
        console.log("📁 Le dossier d'upload est accessible en écriture");
      } catch (error) {
        console.error(
          "❌ Le dossier d'upload n'est pas accessible en écriture:",
          error
        );
      }
    }

    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Générer un nom de fichier unique pour éviter les collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// Filtre pour n'accepter que les fichiers image
const fileFilter = (_req: any, file: any, cb: any) => {
  // Définir les types MIME acceptés pour les images
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    // Accepter le fichier s'il est d'un type autorisé
    cb(null, true);
  } else {
    // Rejeter le fichier avec un message d'erreur explicite
    cb(
      new Error(
        "Type de fichier non autorisé. Seules les images sont acceptées."
      )
    );
  }
};

// Configuration de l'instance Multer avec les options définies
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite la taille des fichiers à 5 Mo
  },
});

/**
 * Route POST pour uploader une image d'avatar
 * Endpoint: POST /api/upload/avatar
 * Sécurisée par le middleware d'authentification JWT
 */
// @ts-ignore - Ignorer l'erreur de compatibilité entre différentes versions des types Express
router.post("/avatar", authenticateToken, (req, res) => {
  console.log("🔍 Requête d'upload reçue");
  console.log("🔍 Headers:", req.headers);
  console.log("🔍 Body:", req.body);

  // Utiliser Multer comme middleware pour traiter le fichier unique
  upload.single("image")(req, res, async (err) => {
    // Gérer les erreurs de Multer (taille, type de fichier, etc.)
    if (err) {
      console.error("❌ Erreur Multer:", err);
      return res.status(400).json({
        success: false,
        message: `Erreur lors de l'upload du fichier: ${err.message}`,
      });
    }

    // Vérifier la présence du fichier
    if (!req.file) {
      console.error("❌ Aucun fichier reçu");
      console.log("🔍 Request après traitement par Multer:", req.body);
      return res.status(400).json({
        success: false,
        message:
          "Aucun fichier n'a été fourni ou le fichier n'est pas une image valide.",
      });
    }

    console.log(
      "✅ Fichier reçu:",
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      "bytes"
    );

    try {
      // Récupérer le chemin du fichier temporaire
      const tempFilePath = req.file.path;

      try {
        // Uploader l'image vers Cloudinary
        const imageUrl = await uploadImageToCloudinary(tempFilePath);

        // Supprimer le fichier temporaire après l'upload réussi
        // Utilisation de unlinkSync pour s'assurer que le fichier est supprimé
        fs.unlinkSync(tempFilePath);

        // Envoyer la réponse avec l'URL de l'image
        return res.status(200).json({
          success: true,
          imageUrl,
        });
      } catch (uploadError) {
        // En cas d'erreur lors de l'upload vers Cloudinary
        console.error("Erreur lors de l'upload vers Cloudinary:", uploadError);

        // Supprimer le fichier temporaire en cas d'échec
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'upload vers Cloudinary",
          error: (uploadError as Error).message,
        });
      }
    } catch (error) {
      // Gestion des erreurs générales
      console.error("Erreur lors du traitement de l'upload:", error);

      return res.status(500).json({
        success: false,
        message: "Une erreur est survenue lors de l'upload de l'image",
        error: (error as Error).message,
      });
    }
  });
});

// Exporter le routeur
export const uploadRoutes = router;
