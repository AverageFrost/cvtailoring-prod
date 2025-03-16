
import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { File, X, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FileUploadAreaProps {
  onFileUpload: (file: File) => void;
  onRemoveFile: () => void;
  file: File | null;
  acceptedTypes: string;
  uploadText: string;
  acceptedTypesText: string;
  icon: React.ReactNode;
  height?: string;
  isProcessing?: boolean;
  isUploading?: boolean;
  isExistingFile?: boolean; // New prop to indicate if file is from storage
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileUpload,
  onRemoveFile,
  file,
  acceptedTypes,
  uploadText,
  acceptedTypesText,
  icon,
  height = "h-[150px]",
  isProcessing = false,
  isUploading = false,
  isExistingFile = false, // Default to false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (isProcessing || isUploading) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const fileExtension = `.${file.name.split(".").pop()}`.toLowerCase();
        
        if (acceptedTypes.includes(fileExtension)) {
          onFileUpload(file);
        } else {
          toast({
            title: "Invalid file type",
            description: `Please upload a file with ${acceptedTypesText.toLowerCase()}`,
            variant: "destructive",
          });
        }
      }
    },
    [acceptedTypes, acceptedTypesText, onFileUpload, toast, isProcessing, isUploading]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || isUploading) return;
      
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const fileExtension = `.${file.name.split(".").pop()}`.toLowerCase();
        
        if (acceptedTypes.includes(fileExtension)) {
          onFileUpload(file);
        } else {
          toast({
            title: "Invalid file type",
            description: `Please upload a file with ${acceptedTypesText.toLowerCase()}`,
            variant: "destructive",
          });
        }
      }
    },
    [acceptedTypes, acceptedTypesText, onFileUpload, toast, isProcessing, isUploading]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {!file ? (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            `flex flex-col items-center justify-center ${height} border-2 border-dashed rounded-md cursor-pointer transition-colors`,
            isDragging
              ? "border-[#AF93C8] bg-[#F8F6FE]"
              : "border-[#E2DCF8] hover:border-[#AF93C8] hover:bg-[#F8F6FE]"
          )}
        >
          <input
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing || isUploading}
          />
          <div className="flex flex-col items-center">
            {isUploading ? (
              <Loader className="h-12 w-12 text-[#AF93C8] animate-spin" />
            ) : (
              icon
            )}
            <p className="mt-2 text-[#3F2A51] font-medium">
              {isUploading ? "Uploading..." : uploadText}
            </p>
            <p className="mt-1 text-sm text-[#AF93C8]">{acceptedTypesText}</p>
          </div>
        </label>
      ) : (
        <div className={`flex flex-col items-center justify-center bg-[#F8F6FE] rounded-md p-4 ${height} border-2 border-[#AF93C8]`}>
          <div className="flex flex-col items-center w-full">
            <File className="h-16 w-16 text-[#AF93C8] mb-3" />
            <div className="w-full px-4 flex flex-col items-center">
              <p className="font-medium text-[#3F2A51] text-center w-full break-words overflow-hidden" style={{ wordBreak: "break-word", maxWidth: "100%" }}>
                {file.name}
              </p>
              <p className="text-sm text-[#AF93C8] mt-1 mb-4">
                {formatFileSize(file.size)}
                {isExistingFile && " (Previously Uploaded)"}
              </p>
            </div>
            
            {!isProcessing && !isUploading && (
              <Button
                onClick={onRemoveFile}
                variant="outline"
                size="sm"
                className="mt-2 bg-white hover:bg-gray-50 border-gray-200"
                aria-label="Remove file"
                disabled={isProcessing || isUploading}
              >
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadArea;
