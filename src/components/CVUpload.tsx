import { useState } from "react";
import { Upload, File, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/airtable-ds/button";
import { Card } from "@/components/ui/airtable-ds/card";
import { toast } from "@/components/ui/airtable-ds/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CVUploadProps {
  onUploadSuccess: (url: string, fileName: string) => void;
  onUploadError: (error: string) => void;
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
}

const CVUpload = ({
  onUploadSuccess,
  onUploadError,
  isUploading,
  setIsUploading,
}: CVUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuth();

  const acceptedFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      return;
    }

    const selectedFile = e.target.files[0];

    // Validate file type
    if (!acceptedFileTypes.includes(selectedFile.type)) {
      toast.error("Invalid file type. Please upload a PDF, DOC, or DOCX file.");
      setFile(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      toast.error("File too large. Maximum size is 10MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const uploadCV = async () => {
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // Create a folder structure with user ID to ensure proper permissions
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError, data } = await supabase.storage
        .from("user_cvs")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("user_cvs").getPublicUrl(filePath);

      onUploadSuccess(publicUrl, file.name);
      toast.success("CV uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading CV:", error.message);
      onUploadError(error.message);
      toast.error(`Failed to upload CV: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-primary/5 p-6 rounded-lg">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/20 rounded-lg p-6 transition-colors duration-200 hover:border-primary/40">
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <File className="h-12 w-12 text-primary/70" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-primary/70" />
              <p className="text-sm font-medium">Drag & drop your CV here</p>
              <p className="text-xs text-muted-foreground">
                or click to browse (PDF, DOC, DOCX up to 10MB)
              </p>
            </>
          )}
          <input
            type="file"
            id="cv-upload"
            className="hidden"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <label htmlFor="cv-upload">
            <Button
              variant="outline"
              className="mt-4"
              type="button"
              disabled={isUploading}
              onClick={() => document.getElementById("cv-upload")?.click()}
            >
              Select File
            </Button>
          </label>
        </div>

        {file && (
          <div className="flex items-center gap-4">
            <Button
              onClick={uploadCV}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? "Uploading..." : "Upload CV"}
              {isUploading && <span className="animate-spin">⟳</span>}
            </Button>
            <Button
              variant="outline"
              onClick={() => setFile(null)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 text-amber-600 text-xs mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>Your CV will be processed to enrich your profile</span>
        </div>
      </div>
    </Card>
  );
};

export default CVUpload;
