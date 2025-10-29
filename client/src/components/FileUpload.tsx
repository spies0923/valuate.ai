"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import axios from "axios";
import { serverUrl } from "@/utils/utils";
import { useAuth } from "@/contexts/AuthContext";

interface FileUploadProps {
    onUploadComplete?: (files: { url: string; name: string; size: number; type: string }[]) => void;
    onUploadError?: (error: Error) => void;
    maxFiles?: number;
    accept?: string;
    className?: string;
}

export default function FileUpload({
    onUploadComplete,
    onUploadError,
    maxFiles = 10,
    accept = "image/*,application/pdf",
    className = ""
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { token } = useAuth();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Validate file count
        if (files.length > maxFiles) {
            const error = new Error(`Maximum ${maxFiles} files allowed`);
            onUploadError?.(error);
            return;
        }

        // Validate file sizes (8MB max per file)
        const maxSize = 8 * 1024 * 1024; // 8MB
        for (let i = 0; i < files.length; i++) {
            if (files[i].size > maxSize) {
                const error = new Error(`File "${files[i].name}" exceeds 8MB limit`);
                onUploadError?.(error);
                return;
            }
        }

        setUploading(true);

        try {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append("files", files[i]);
            }

            const response = await axios.post(`${serverUrl}/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                onUploadComplete?.(response.data.data);
            } else {
                throw new Error(response.data.message || "Upload failed");
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            const uploadError = new Error(
                error.response?.data?.message || error.message || "Failed to upload files"
            );
            onUploadError?.(uploadError);
        } finally {
            setUploading(false);
            // Reset input so the same file can be uploaded again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={className}>
            <input
                ref={fileInputRef}
                type="file"
                multiple={maxFiles > 1}
                accept={accept}
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            <Button
                type="button"
                variant="outline"
                onClick={handleButtonClick}
                disabled={uploading}
            >
                {uploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                    </>
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose {maxFiles > 1 ? "Files" : "File"}
                    </>
                )}
            </Button>
        </div>
    );
}
