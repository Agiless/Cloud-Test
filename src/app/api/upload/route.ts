import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

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

        // Convert file to base64 for Cloudinary upload
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(base64Image, {
            folder: "class-test-answers",
            public_id: `${batchNumber}_${questionNumber}`,
            overwrite: true,
            resource_type: "image",
        });

        return NextResponse.json({ success: true, url: uploadResponse.secure_url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload failed" },
            { status: 500 }
        );
    }
}
