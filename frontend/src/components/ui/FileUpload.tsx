import { Upload } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import Button from "./Button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onPreviewChange: (previewUrl: string | null) => void;
  className?: string;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
  buttonText?: string;
  error?: string;
  hideNoFileText?: boolean;
  buttonClassName?: string;
}

/**
 * Composant de téléchargement de fichier avec prévisualisation
 */
const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onPreviewChange,
  className = "",
  acceptedTypes = "image/*",
  maxSizeMB = 2,
  label = "Télécharger un fichier",
  buttonText = "Parcourir",
  error,
  hideNoFileText = false,
  buttonClassName = "cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-600",
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [fileError, setFileError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Gère la sélection de fichier et valide le type et la taille
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log("🔍 Événement de changement de fichier détecté", e);
    const file = e.target.files?.[0];
    console.log("🔍 Fichier sélectionné:", file);
    setFileError("");

    if (!file) {
      console.log("⚠️ Aucun fichier sélectionné");
      setSelectedFileName("");
      onPreviewChange(null);
      return;
    }

    // Validation du type de fichier
    const fileType = file.type;
    const isAccepted =
      acceptedTypes === "*" ||
      (acceptedTypes.includes("/*")
        ? fileType.startsWith(acceptedTypes.split("/")[0])
        : acceptedTypes.includes(fileType));

    if (!isAccepted) {
      setFileError(`Type de fichier non accepté. Utilisez: ${acceptedTypes}`);
      setSelectedFileName("");
      onPreviewChange(null);
      return;
    }

    // Validation de la taille
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError(`La taille du fichier dépasse ${maxSizeMB}MB`);
      setSelectedFileName("");
      onPreviewChange(null);
      return;
    }

    // Fichier valide
    setSelectedFileName(file.name);
    onFileSelect(file);

    // Créer la prévisualisation si c'est une image
    if (fileType.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onPreviewChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      onPreviewChange(null);
    }
  };

  // Fonction pour déclencher le clic sur l'input file
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Générer un ID unique pour l'input file
  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium mb-2"
        >
          {label}
        </label>
      )}

      <div className="flex items-center space-x-3">
        <input
          type="file"
          id={inputId}
          ref={fileInputRef}
          className="sr-only"
          accept={acceptedTypes}
          onChange={handleFileChange}
          aria-describedby={`${inputId}-description`}
        />

        {/* Utiliser un bouton avec association claire */}
        <Button
          type="button"
          variant="secondary"
          icon={<Upload size={16} aria-hidden="true" />}
          onClick={handleButtonClick}
          className={buttonClassName}
          aria-describedby={`${inputId}-description`}
          aria-label={`${buttonText} - ${acceptedTypes}, maximum ${maxSizeMB}MB`}
        >
          {buttonText}
        </Button>

        {!hideNoFileText && (
          <div 
            id={`${inputId}-description`}
            className="text-sm truncate max-w-xs"
            aria-live="polite"
          >
            {selectedFileName || "Aucun fichier sélectionné"}
          </div>
        )}
      </div>

      {(fileError || error) && (
        <p 
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {fileError || error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
