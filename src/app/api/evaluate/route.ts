import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { addTask, getQueueStatus, getAllResults } from "../../../lib/workerQueue";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/evaluate — fetch all images from Cloudinary and queue for evaluation
export async function POST() {
    try {
        const allImages: { publicId: string; url: string }[] = [];
        let nextCursor: string | undefined = undefined;

        // Paginate through all Cloudinary resources
        do {
            const result: { resources: { public_id: string; secure_url: string }[]; next_cursor?: string } =
                await cloudinary.api.resources({
                    type: "upload",
                    max_results: 100,
                    next_cursor: nextCursor,
                });

            for (const resource of result.resources) {
                allImages.push({
                    publicId: resource.public_id,
                    url: resource.secure_url,
                });
            }

            nextCursor = result.next_cursor;
        } while (nextCursor);

        console.log(`Found ${allImages.length} images in Cloudinary`);

        // Only process files matching batchno_questionno format (e.g. "261045_1")
        // The filename must be {digits}_{digits} pattern
        const VALID_NAME_PATTERN = /^\d+_\d+$/;

        // Queue each image (workerQueue will skip already-evaluated ones)
        let queued = 0;
        let skipped = 0;

        for (const image of allImages) {
            // Extract filename from the public_id (e.g., "class-test/261045_1" → "261045_1")
            const filename = image.publicId.split("/").pop() || image.publicId;

            // Use only the batch number as the name (e.g., "261045_1" → "261045")
            const name = filename.split("_")[0];

            // Skip files that don't match batchno_questionno format
            if (!VALID_NAME_PATTERN.test(name)) {
                console.log(`Skipping ${image.publicId} — doesn't match batchno_qno format`);
                skipped++;
                continue;
            }

            addTask(image.url, image.publicId, name);
            queued++;
        }

        const status = getQueueStatus();

        return NextResponse.json({
            success: true,
            totalFound: allImages.length,
            queued: status.pending,
            alreadyEvaluated: status.evaluated,
            activeWorkers: status.activeWorkers,
            totalWorkers: status.totalWorkers,
        });
    } catch (error) {
        console.error("Evaluate API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch images" },
            { status: 500 }
        );
    }
}

// GET /api/evaluate — get queue status and all results
export async function GET() {
    try {
        const status = getQueueStatus();
        const results = getAllResults();

        return NextResponse.json({
            status,
            results,
        });
    } catch (error) {
        console.error("Evaluate GET error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to get status" },
            { status: 500 }
        );
    }
}
