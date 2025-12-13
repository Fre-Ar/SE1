// app/api/upload/route.ts

import { NextResponse } from "next/server";
import { writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
// NOTE: You must install this package: npm install @azure/storage-blob
import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";

// ==========================================
// 1. CONFIGURATION
// ==========================================

const UPLOAD_SUBDIR = 'images/uploads';
const UPLOAD_DIR = path.join(process.cwd(), 'public', UPLOAD_SUBDIR);

// Azure Configuration (Set in environment variables for production)
const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "letzhist-uploads";
// The public base URL for your blob storage, e.g., https://youraccount.blob.core.windows.net/letzhist-uploads
const AZURE_PUBLIC_BASE_URL = process.env.AZURE_PUBLIC_BASE_URL; 

// ==========================================
// 2. STORAGE IMPLEMENTATIONS
// ==========================================

/**
 * Saves the buffer to the local filesystem (Development/Local).
 * @param buffer The file data buffer.
 * @param fileName The original file name (used for extension).
 * @returns The public URL relative to the Next.js root.
 */
async function saveToLocal(buffer: Buffer, fileName: string): Promise<string> {
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFileName);

    // Ensure the upload directory exists
    try {
        await access(UPLOAD_DIR, constants.F_OK);
    } catch (e) {
        // If directory doesn't exist, create it (best practice for local storage)
        await (await import('fs')).promises.mkdir(UPLOAD_DIR, { recursive: true });
    }

    await writeFile(filePath, buffer);
    return `/${UPLOAD_SUBDIR}/${uniqueFileName}`;
}


/**
 * Uploads the buffer to Azure Blob Storage (Production).
 * @param buffer The file data buffer.
 * @param fileName The original file name (used for extension).
 * @param contentType The file's MIME type.
 * @returns The absolute public URL for the Azure Blob.
 */
async function saveToAzureBlob(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    if (!AZURE_CONNECTION_STRING || !AZURE_PUBLIC_BASE_URL) {
        throw new Error("Azure Storage configuration missing. Check AZURE_STORAGE_CONNECTION_STRING and AZURE_PUBLIC_BASE_URL.");
    }
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);
    
    // Ensure container exists (optional, but good for setup)
    // await containerClient.createIfNotExists();
    
    const fileExtension = path.extname(fileName || '.dat');
    const blobPath = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
    
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: { blobContentType: contentType }
    });
    
    // Construct the public URL using the base URL and the blob path
    return `${AZURE_PUBLIC_BASE_URL}/${blobPath}`;
}


// ==========================================
// 3. HANDLER (The Abstraction Layer)
// ==========================================

export async function POST(request: Request) {
    // Determine the storage provider based on environment variables
    const isProduction = process.env.NODE_ENV === 'production';
    const storageProvider = isProduction ? 'azure' : 'local';
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded in FormData." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        let publicUrl: string;

        if (storageProvider === 'azure') {
            console.log("Using Azure Blob Storage...");
            publicUrl = await saveToAzureBlob(buffer, file.name, file.type);
        } else {
            console.log("Using Local Filesystem Storage...");
            publicUrl = await saveToLocal(buffer, file.name);
        }

        // Return the required success response
        return NextResponse.json({ url: publicUrl }, { status: 200 });

    } catch (error) {
        console.error(`Error during file upload [${storageProvider}]:`, error);
        return NextResponse.json({ error: "Failed to process the upload." }, { status: 500 });
    }
}