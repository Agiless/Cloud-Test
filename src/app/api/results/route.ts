import { NextRequest, NextResponse } from "next/server";
import { getAllResults } from "../../../lib/workerQueue";
import fs from "fs";
import path from "path";

// Load student name mapping
function getStudentMap(): Record<string, string> {
    try {
        const filePath = path.join(process.cwd(), "students.json");
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    } catch {
        return {};
    }
}

export async function GET(request: NextRequest) {
    try {
        const results = getAllResults();
        const studentMap = getStudentMap();
        const { searchParams } = new URL(request.url);
        const searchBatch = searchParams.get("batch");

        // If a specific batch is searched, return detailed results for it
        if (searchBatch) {
            const batchResults = results.filter((r) => r.name.split("_")[0] === searchBatch);

            if (batchResults.length === 0) {
                return NextResponse.json({ found: false, batch: searchBatch, details: [] });
            }

            const details = batchResults.map((r) => ({
                publicId: r.publicId,
                imageUrl: r.imageUrl,
                score: r.evaluation.score,
                correct_blocks: r.evaluation.correct_blocks,
                missing_blocks: r.evaluation.missing_blocks,
                incorrect_blocks: r.evaluation.incorrect_blocks,
                sequence_correct: r.evaluation.sequence_correct,
                feedback: r.evaluation.feedback,
                evaluatedAt: r.evaluatedAt,
            }));

            // Best score for this batch
            const bestScore = Math.max(...details.map((d) => d.score));

            return NextResponse.json({
                found: true,
                batch: searchBatch,
                studentName: studentMap[searchBatch] || searchBatch,
                bestScore,
                details,
            });
        }

        // Build leaderboard: best score per batch number
        const scoreMap = new Map<string, { score: number; feedback: string }>();

        for (const r of results) {
            const batch = r.name.split("_")[0]; // Extract batch number from "261045_1" → "261045"
            const existing = scoreMap.get(batch);

            if (!existing || r.evaluation.score > existing.score) {
                scoreMap.set(batch, {
                    score: r.evaluation.score,
                    feedback: r.evaluation.feedback,
                });
            }
        }

        const leaderboard = Array.from(scoreMap.entries()).map(([batch, data]) => ({
            batch,
            name: studentMap[batch] || batch,
            score: data.score,
            feedback: data.feedback,
        }));

        // Sort descending by score
        leaderboard.sort((a, b) => b.score - a.score);

        // Dense ranking: same score = same rank
        const rankedLeaderboard: { rank: number; batch: string; name: string; score: number; feedback: string }[] = [];
        let currentRank = 1;

        for (let i = 0; i < leaderboard.length; i++) {
            if (i > 0 && leaderboard[i].score < leaderboard[i - 1].score) {
                currentRank++;
            }
            rankedLeaderboard.push({ rank: currentRank, ...leaderboard[i] });
        }

        // Organizer batch numbers
        const ORGANIZERS = new Set(["261002", "261042"]);

        // Find absent students (in students.json but not evaluated, excluding organizers)
        const evaluatedBatches = new Set(rankedLeaderboard.map((r) => r.batch));
        const absentStudents = Object.entries(studentMap)
            .filter(([batch]) => !evaluatedBatches.has(batch) && !ORGANIZERS.has(batch))
            .map(([batch, name]) => ({
                rank: "-" as const,
                batch,
                name,
                score: "Absent" as const,
                feedback: "",
            }));

        // Organizer entries
        const organizers = Object.entries(studentMap)
            .filter(([batch]) => ORGANIZERS.has(batch))
            .map(([batch, name]) => ({
                rank: "★" as const,
                batch,
                name,
                score: "Organizer" as const,
                feedback: "",
            }));

        return NextResponse.json({
            leaderboard: [...rankedLeaderboard, ...absentStudents, ...organizers],
            totalEvaluated: results.length,
        });
    } catch (error) {
        console.error("Failed to read results:", error);
        return NextResponse.json({ leaderboard: [] }, { status: 500 });
    }
}
