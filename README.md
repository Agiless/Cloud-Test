# Class Test Application

A Next.js application built to facilitate class tests where students upload images of their hand-written answers. The application features a streamlined mobile-first UI, a background worker queue for automated evaluation using Google's Gemini AI, and a real-time leaderboard.

## Project Workflow

The application operates through several distinct phases: Login, Test Execution, Background Evaluation, and Results Validation.

### 1. Student Login & Authentication
- **Access**: Students navigate to the home page (`/`).
- **Input**: The student is presented with a login screen where they must enter their **Full Name** and a **6-digit Batch Number**.
- **Validation**: The form ensures the name is provided and the batch number matches the 6-digit format before they can proceed. no complex backend authentication is required for this step.

### 2. Test Execution & Image Upload
- **Test View**: Upon successful login, the student enters the `TestView`. Here they see their details and a list of questions.
- **Image Capture/Upload**: Each question is presented in a `QuestionCard`. Students can either select an image from their gallery or use their camera to instantly snap a photo of their answer.
- **Instant Local Upload**: When the student taps "Upload":
  - The image is sent to the `/api/upload` endpoint asynchronously.
  - The server immediately saves the image to an `uploads/` folder on the local file system.
  - The server adds this image to the background worker queue and **instantly returns a success response** to the frontend. This ensures the student doesn't have to wait for the AI evaluation to finish before moving on to the next question.
- **Submission**: Once all questions have files uploaded, the student can hit "Submit All" to see the success completion screen.

### 3. Background AI Evaluation (The Worker Queue)
- **Queue System**: Built into `src/lib/workerQueue.ts`, a queue processes files in the background without blocking the main web server threads.
- **Multi-key Processing**: The queue is configured to use up to 8 different Gemini API keys concurrently, allowing for rapid batch processing of many student submissions at once.
- **Evaluation**: Each background worker calls `evaluateSingleDiagram()` (in `src/lib/evaluateDiagram.ts`), passing the local image path and the assigned API key to Google's Gemini model.
- **Data Recording & Cleanup**:
  - Once Gemini returns a score, the worker appends a new line to `src/app/api/upload/result.csv` in the format: `Name, BatchNumber, Score`.
  - Finally, the worker safely deletes the temporary image from the `uploads/` folder to save local disk space.

### 4. Checking Results & Leaderboard
- **Access**: Students can click the "Check Results" link on the home page to visit `/results`.
- **Lookup**: They enter their 6-digit batch number to see how they performed.
- **Dynamic Leaderboard**: The Results page queries the `/api/results` endpoint. 
  - This endpoint reads the `result.csv` file.
  - It handles cases where a student might have multiple entries (e.g., re-uploading) by consistently selecting only their **highest score**.
  - It sorts the scores and generates a ranked leaderboard.
- **Highlighting**: If the student's batch number is found in the generated leaderboard, their row is highlighted. If they haven't been evaluated yet, their name is appended to the bottom showing a "Pending" status and unranked position.

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

> Note: To configure the AI testing, add your Gemini keys to `.env.local` (e.g. `GEMINI_KEY_1="your-key"`) and insert your logic into `src/lib/evaluateDiagram.ts`.
