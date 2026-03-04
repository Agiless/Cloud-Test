import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "src", "app", "api", "upload", "result.csv");
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ leaderboard: [] });
        }

        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n").filter(line => line.trim() !== "");

        const scoreMap = new Map<string, { score: number; name?: string }>();
        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(",");
            let tempName = undefined;
            let tempBatch = undefined;
            let tempScoreStr = undefined;

            if (parts.length === 3) {
                // assume structure: name, batchno, mark
                tempName = parts[0].trim();
                tempBatch = parts[1].trim();
                tempScoreStr = parts[2].trim();
            } else if (parts.length === 2) {
                // assume structure: batchno, mark
                tempBatch = parts[0].trim();
                tempScoreStr = parts[1].trim();
            } else {
                continue;
            }

            if (!tempBatch || !tempScoreStr) continue;

            const score = parseFloat(tempScoreStr);
            if (isNaN(score)) continue; // skip headers

            const batchId = tempBatch;
            const existingEntry = scoreMap.get(batchId);

            if (!existingEntry || score > existingEntry.score) {
                // Only save/overwrite name if it's the highest score run
                scoreMap.set(batchId, { score, name: tempName });
            }
        }

        const leaderboard = Array.from(scoreMap.entries()).map(([batch, data]) => ({
            batch,
            score: data.score,
            name: data.name
        }));

        // Sort descending by score
        leaderboard.sort((a, b) => b.score - a.score);

        // Add ranks
        const rankedLeaderboard = leaderboard.map((item, index) => ({
            rank: index + 1,
            batch: item.batch,
            score: item.score
        }));

        return NextResponse.json({ leaderboard: rankedLeaderboard });
    } catch (error) {
        console.error("Failed to read results CSV:", error);
        return NextResponse.json({ leaderboard: [] }, { status: 500 });
    }
}
