import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { addTask } from "../../../lib/workerQueue";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

        // Convert file to base64 and upload to Cloudinary
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64}`;

        const publicId = `class-test/${batchNumber}_${questionNumber}`;

        const uploadResult = await cloudinary.uploader.upload(dataUrl, {
            public_id: publicId,
            folder: undefined, // public_id already has the folder
            resource_type: "image",
        });

        console.log(`Uploaded to Cloudinary: ${uploadResult.secure_url}`);

        // Queue for Gemini evaluation (skips if already evaluated)
        addTask(uploadResult.secure_url, uploadResult.public_id, batchNumber);

        return NextResponse.json({ success: true, url: uploadResult.secure_url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload failed" },
            { status: 500 }
        );
    }
}
