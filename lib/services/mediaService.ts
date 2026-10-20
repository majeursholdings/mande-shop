import axios from "axios";
import { api } from "@/lib/api";

/**
 * What an upload is for. The API decides who may upload what (see
 * mande-backend's media.validation.ts); these are the purposes open to
 * customers.
 */
export type UploadPurpose = "return-photo";

interface SignatureResponse {
    uploadUrl: string;
    fields: Record<string, string | number | boolean>;
    maxBytes?: number;
}

export interface UploadResult {
    publicId: string;
    url: string;
    format?: string;
    resourceType?: string;
    bytes?: number;
}

export interface FileMetadata {
    id: string;
    date: string;
    source: string;
    category: string;
    originalName?: string;
}

/** A finished upload, in the shape a form field keeps it. */
export interface CloudinaryUploadResult {
    id: string;
    publicId: string;
    url: string;
    name: string;
    originalName: string;
    format: string;
    bytes: number;
    resourceType: "image" | "raw" | "video";
    category: string;
    metadata: FileMetadata;
}

export const mediaService = {
    /** Uploads `file` straight to Cloudinary with a signature from the API, so the Cloudinary secret never reaches the browser. */
    async uploadFile(file: File, purpose: UploadPurpose, onProgress?: (percent: number) => void, signal?: AbortSignal): Promise<UploadResult> {
        const { data: signature } = await api.post<SignatureResponse>("/media/signature", { purpose }, { signal });

        const formData = new FormData();
        for (const [key, value] of Object.entries(signature.fields ?? {})) formData.append(key, String(value));
        formData.append("file", file);

        const { data } = await axios.post<{ public_id: string; secure_url: string; format: string; bytes: number; resource_type: string }>(
            signature.uploadUrl,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
                signal,
                onUploadProgress: (event) => {
                    if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
                },
            },
        );

        return { publicId: data.public_id, url: data.secure_url, format: data.format, bytes: data.bytes, resourceType: data.resource_type };
    },
};
