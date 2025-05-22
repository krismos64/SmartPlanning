import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from "cloudinary";
import dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Configuration de Cloudinary avec les variables d'environnement
// Assurez-vous que CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, et CLOUDINARY_API_SECRET sont définis dans votre .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Utiliser HTTPS pour les URLs
});

/**
 * Uploade une image vers Cloudinary.
 *
 * @param filePath Le chemin d'accès local du fichier à uploader.
 * @returns Une promesse qui se résout avec l'URL sécurisée de l'image uploadée.
 * @throws Lance une erreur si l'upload échoue ou si les variables d'environnement ne sont pas configurées.
 */
export const uploadImageToCloudinary = async (
  filePath: string
): Promise<string> => {
  // Vérification initiale des variables d'environnement
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error(
      "Erreur: Les variables d'environnement Cloudinary ne sont pas toutes définies."
    );
    throw new Error(
      "Configuration Cloudinary manquante. Veuillez vérifier les variables d'environnement."
    );
  }

  try {
    // Uploader l'image vers Cloudinary
    // La fonction upload de Cloudinary retourne une promesse
    const result: UploadApiResponse | UploadApiErrorResponse =
      await cloudinary.uploader.upload(filePath, {
        // Options d'upload (facultatif), par exemple :
        // folder: "my_folder", // Pour organiser les images dans des dossiers sur Cloudinary
        // public_id: "custom_name", // Pour spécifier un nom de fichier personnalisé
        // overwrite: true, // Pour écraser un fichier existant avec le même public_id
      });

    // Vérifier si l'upload a réussi et si 'secure_url' est présente
    if (result && result.secure_url) {
      // Log de l'URL de l'image uploadée
      console.log(
        `Image uploadée avec succès sur Cloudinary. URL: ${result.secure_url}`
      );
      // Retourner l'URL publique et sécurisée de l'image
      return result.secure_url;
    } else {
      // Gérer le cas où secure_url n'est pas retournée (peut arriver avec UploadApiErrorResponse)
      console.error(
        "Erreur lors de l'upload Cloudinary: secure_url non trouvée dans la réponse.",
        result
      );
      throw new Error(
        "Erreur lors de l'upload vers Cloudinary: La réponse ne contient pas secure_url."
      );
    }
  } catch (error) {
    // Gérer les erreurs potentielles lors de l'upload
    console.error("Erreur détaillée lors de l'upload sur Cloudinary:", error);
    // Propager l'erreur pour que l'appelant puisse la gérer
    throw new Error(
      `Échec de l\'upload de l\'image sur Cloudinary: ${
        (error as Error).message
      }`
    );
  }
};

// Exemple d'utilisation (à décommenter pour tester localement si besoin)
/*
(async () => {
  if (process.argv.length < 3) {
    console.log("Veuillez fournir le chemin d'un fichier image en argument.");
    console.log("Usage: node <chemin-vers-ce-fichier.js> <chemin-vers-image.jpg>");
    return;
  }
  const imagePath = process.argv[2];
  try {
    const imageUrl = await uploadImageToCloudinary(imagePath);
    console.log(`URL de l'image retournée par la fonction: ${imageUrl}`);
  } catch (e) {
    console.error(`Échec du test d'upload: ${(e as Error).message}`);
  }
})();
*/
