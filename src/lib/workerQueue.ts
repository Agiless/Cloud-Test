import fs from "fs";
import { evaluateSingleDiagram } from "./evaluateDiagram";

const API_KEYS = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5,
    process.env.GEMINI_KEY_6,
    process.env.GEMINI_KEY_7,
    process.env.GEMINI_KEY_8
].filter(Boolean) as string[];

interface EvaluationTask {
    imagePath: string;
    batchNumber: string;
    name: string;
}

const queue: EvaluationTask[] = [];
const workersBusy = new Array(API_KEYS.length).fill(false);

export function addTask(imagePath: string, batchNumber: string, name: string) {
    queue.push({ imagePath, batchNumber, name });
    processQueue();
}

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

async function runWorker(workerIndex: number, task: EvaluationTask) {
    const apiKey = API_KEYS[workerIndex];
    workersBusy[workerIndex] = true;

    try {
        console.log(`Worker ${workerIndex + 1} processing ${task.imagePath} for ${task.batchNumber}`);

        // Run the evaluation (using the provided snippet code style)
        const result = await evaluateSingleDiagram(task.imagePath, apiKey);
        console.log(`Evaluation Result for ${task.batchNumber}:`, result);

        // Append to result.csv
        const csvLine = `${task.name},${task.batchNumber},${result}\n`;
        fs.appendFileSync("./src/app/api/upload/result.csv", csvLine, "utf8");

        // Delete the local image after evaluation is complete
        await fs.promises.unlink(task.imagePath);
        console.log(`Deleted temporary image: ${task.imagePath}`);
    } catch (err) {
        console.error(`Worker Error on ${task.batchNumber}:`, err);

        // Still attempt to delete on error to avoid clutter
        try {
            await fs.promises.unlink(task.imagePath);
            console.log(`Cleaned up image after error: ${task.imagePath}`);
        } catch (unlinkErr) {
            console.error(`Failed to delete image: ${task.imagePath}`, unlinkErr);
        }
    } finally {
        workersBusy[workerIndex] = false;
        processQueue();
    }
}
