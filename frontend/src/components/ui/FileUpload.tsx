import { Upload } from "lucide-react";
import React, { ChangeEvent, useState } from "react";
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
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [fileError, setFileError] = useState<string>("");

  /**
   * Gère la sélection de fichier et valide le type et la taille
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");

    if (!file) {
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

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}

      <div className="flex items-center space-x-3">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedTypes}
          onChange={handleFileChange}
        />

        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="secondary"
            icon={<Upload size={16} />}
            className="cursor-pointer"
          >
            {buttonText}
          </Button>
        </label>

        <div className="text-sm truncate max-w-xs">
          {selectedFileName || "Aucun fichier sélectionné"}
        </div>
      </div>

      {(fileError || error) && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {fileError || error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
