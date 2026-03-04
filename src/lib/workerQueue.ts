import fs from "fs";
import path from "path";
import { evaluateSingleDiagram } from "./evaluateDiagram";

const API_KEYS = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5,
    process.env.GEMINI_KEY_6,
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

        // Move the local image after evaluation is complete
        const destDir = path.join(process.cwd(), "evaluated");
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        const destPath = path.join(destDir, path.basename(task.imagePath));
        await fs.promises.rename(task.imagePath, destPath);
        console.log(`Moved image to evaluated folder: ${destPath}`);
    } catch (err) {
        console.error(`Worker Error on ${task.batchNumber}:`, err);

        // Move the file even on error to avoid clutter in the active uploads folder
        try {
            const destDir = path.join(process.cwd(), "evaluated");
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            const destPath = path.join(destDir, path.basename(task.imagePath));
            await fs.promises.rename(task.imagePath, destPath);
            console.log(`Moved image to evaluated folder after error: ${destPath}`);
        } catch (moveErr) {
            console.error(`Failed to move image: ${task.imagePath}`, moveErr);
        }
    } finally {
        workersBusy[workerIndex] = false;
        processQueue();
    }
}
