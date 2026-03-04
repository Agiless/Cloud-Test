import { NextRequest, NextResponse } from "next/server";
import { addTask } from "../../../lib/workerQueue";
import fs from "fs";
import path from "path";

// Ensure local uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const batchNumber = formData.get("batchNumber") as string | null;
        const questionNumber = formData.get("questionNumber") as string | null;
        const name = formData.get("name") as string | null || "Unknown";

        if (!file || !batchNumber || !questionNumber) {
            return NextResponse.json(
                { error: "Missing file, batchNumber, or questionNumber" },
                { status: 400 }
            );
        }

        // Generate a unique local filename
        const ext = file.name.split('.').pop() || 'png';
        const filename = `${batchNumber}_q${questionNumber}_${Date.now()}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        // Save file locally
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.promises.writeFile(filePath, buffer);

        // Add to the background worker queue format: name, batchno, local-path
        addTask(filePath, batchNumber, name);

        // Return a mock local URL for the frontend success state (it won't render but satisfies the API)
        return NextResponse.json({ success: true, url: `/local-upload-queued` });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload failed" },
            { status: 500 }
        );
    }
}
