import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `You are an expert evaluator of computer science diagrams.

Your task is to compare a student's block diagram with the correct reference description of the Live Virtual Machine Migration process.

Reference Diagram Description:

The system illustrates the live migration of a Virtual Machine (VM) from Host A to Host B through sequential stages.

Flow of blocks and connections:

VM Running on Host A
→ Stage 0: Pre-Migration
→ Stage 1: Reservation
→ Stage 2: Iterative Pre-Copy
→ Stage 3: Stop and Copy
→ Stage 4: Commitment
→ Stage 5: Activation
→ VM Running on Host B

Stage Descriptions:

Stage 0 – Pre-Migration
The VM is active on Host A. The system selects an alternate physical host (Host B) for migration. Block devices may be mirrored and resources are prepared on the destination host.

Stage 1 – Reservation
A container or virtual machine environment is initialized on the target host (Host B). Necessary CPU, memory, and system resources are reserved.

Stage 2 – Iterative Pre-Copy
Memory pages are copied from Host A to Host B while the VM continues running. Shadow paging is enabled to track memory updates, and modified (dirty) pages are copied repeatedly in several rounds.

Stage 3 – Stop and Copy
The VM is temporarily suspended on Host A. The remaining memory pages and VM state are transferred to Host B. Network traffic is redirected to Host B using ARP updates. This stage introduces short downtime.

Stage 4 – Commitment
The VM state stored on Host A is released after confirming successful migration.

Stage 5 – Activation
The VM starts running on Host B, reconnects to local devices, and resumes normal operations.

Logical Regions in the Diagram:

Overhead Due to Copying
Occurs during the Iterative Pre-Copy stage while memory pages are repeatedly transferred.

Downtime
Occurs during the Stop and Copy stage when the VM is briefly paused.

Evaluation Instructions:

Compare the student diagram with the reference description and evaluate based on:

1. Presence of correct blocks
2. Correct sequence of stages
3. Logical flow between blocks
4. Missing stages
5. Incorrect or extra stages

Give marks out of 100.

Return ONLY the following JSON format:

{
"score": number,
"correct_blocks": [],
"missing_blocks": [],
"incorrect_blocks": [],
"sequence_correct": true,
"feedback": "short explanation"
}`;

export interface EvaluationResult {
    score: number;
    correct_blocks: string[];
    missing_blocks: string[];
    incorrect_blocks: string[];
    sequence_correct: boolean;
    feedback: string;
}

export async function evaluateSingleDiagram(
    imageUrl: string,
    apiKey: string
): Promise<EvaluationResult> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
        PROMPT,
        {
            fileData: {
                fileUri: imageUrl,
                mimeType: "image/png",
            },
        },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as EvaluationResult;
    }

    return {
        score: 0,
        correct_blocks: [],
        missing_blocks: [],
        incorrect_blocks: [],
        sequence_correct: false,
        feedback: "Evaluation parsing failed",
    };
}