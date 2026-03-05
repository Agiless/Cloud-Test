import fs from "fs";
import path from "path";
import { evaluateSingleDiagram, EvaluationResult } from "./evaluateDiagram";

// ===== API KEYS (round-robin) =====
const API_KEYS = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5,
    process.env.GEMINI_KEY_6,
].filter(Boolean) as string[];

// ===== TYPES =====
interface EvaluationTask {
    imageUrl: string;
    publicId: string;
    name: string;
}

export interface StoredResult {
    publicId: string;
    imageUrl: string;
    name: string;
    evaluation: EvaluationResult;
    evaluatedAt: string;
}

// ===== RESULTS FILE =====
const RESULTS_FILE = path.join(process.cwd(), "results.json");

// ===== QUEUE STATE =====
const queue: EvaluationTask[] = [];
const workersBusy = new Array(API_KEYS.length).fill(false);

// ===== READ EXISTING RESULTS =====
function readResults(): StoredResult[] {
    try {
        if (fs.existsSync(RESULTS_FILE)) {
            const data = fs.readFileSync(RESULTS_FILE, "utf-8");
            return JSON.parse(data);
        }
    } catch {
        console.error("Failed to read results.json, starting fresh");
    }
    return [];
}

// ===== WRITE RESULTS =====
function writeResults(results: StoredResult[]) {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), "utf-8");
}

// ===== CHECK IF ALREADY EVALUATED =====
export function isAlreadyEvaluated(publicId: string): boolean {
    const results = readResults();
    return results.some((r) => r.publicId === publicId);
}

// ===== ADD TASK TO QUEUE =====
export function addTask(imageUrl: string, publicId: string, name: string) {
    // Skip if already evaluated
    if (isAlreadyEvaluated(publicId)) {
        console.log(`Skipping ${publicId} — already evaluated`);
        return;
    }

    // Skip if already in queue
    if (queue.some((t) => t.publicId === publicId)) {
        console.log(`Skipping ${publicId} — already in queue`);
        return;
    }

    queue.push({ imageUrl, publicId, name });
    processQueue();
}

// ===== GET QUEUE STATUS =====
export function getQueueStatus() {
    const results = readResults();
    const busyCount = workersBusy.filter(Boolean).length;
    return {
        pending: queue.length,
        activeWorkers: busyCount,
        totalWorkers: API_KEYS.length,
        evaluated: results.length,
    };
}

// ===== GET ALL RESULTS =====
export function getAllResults(): StoredResult[] {
    return readResults();
}

// ===== PROCESS QUEUE =====
async function processQueue() {
    for (let i = 0; i < API_KEYS.length; i++) {
        if (workersBusy[i]) continue;
        if (queue.length === 0) return;

        const task = queue.shift();
        if (task) {
            runWorker(i, task);
        }
    }
}

// ===== RUN WORKER =====
async function runWorker(workerIndex: number, task: EvaluationTask) {
    const apiKey = API_KEYS[workerIndex];
    workersBusy[workerIndex] = true;

    try {
        console.log(
            `Worker ${workerIndex + 1} evaluating ${task.publicId} using key ${workerIndex + 1}`
        );

        const evaluation = await evaluateSingleDiagram(task.imageUrl, apiKey);

        console.log(
            `✅ ${task.publicId} → Score: ${evaluation.score}`
        );

        // Append to results.json
        const results = readResults();
        results.push({
            publicId: task.publicId,
            imageUrl: task.imageUrl,
            name: task.name,
            evaluation,
            evaluatedAt: new Date().toISOString(),
        });
        writeResults(results);
    } catch (err) {
        console.error(`❌ Worker ${workerIndex + 1} error on ${task.publicId}:`, err);
    } finally {
        workersBusy[workerIndex] = false;
        processQueue();
    }
}
