import { NextRequest, NextResponse } from "next/server";
import cloudinary from "../../../lib/cloudinary";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const batchNumber = formData.get("batchNumber") as string | null;
        const questionNumber = formData.get("questionNumber") as string | null;

        if (!file || !batchNumber || !questionNumber) {
            return NextResponse.json(
                { error: "Missing file, batchNumber, or questionNumber" },
                { status: 400 }
            );
        }

        // Convert file to base64 data URI for Cloudinary upload
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const mimeType = file.type || "image/png";
        const dataUri = `data:${mimeType};base64,${base64}`;

        // Upload to Cloudinary with public_id in batchno_questionno format
        const result = await cloudinary.uploader.upload(dataUri, {
            public_id: `${batchNumber}_${questionNumber}`,
            overwrite: true,
            folder: "cloud-test",
        });

        console.log(`Uploaded to Cloudinary: ${result.secure_url}`);

        return NextResponse.json({
            success: true,
            url: result.secure_url,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload failed" },
            { status: 500 }
        );
    }
}
