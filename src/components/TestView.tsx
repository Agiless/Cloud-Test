"use client";

import { useState } from "react";
import QuestionCard from "./QuestionCard";

interface TestViewProps {
    name: string;
    batchNumber: string;
    onLogout: () => void;
}

const QUESTIONS = [
    { id: 1, text: "Question 1: Vm migration" },
    { id: 2, text: "Question 2: Desktop virtualization" },
    { id: 3, text: "Question 3: Google App Engine" },
];

export default function TestView({ name, batchNumber, onLogout }: TestViewProps) {
    const [uploadedMap, setUploadedMap] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const allUploaded = QUESTIONS.some((q) => uploadedMap[q.id]);

    const handleUploadComplete = (qNum: number, url: string) => {
        setUploadedMap((prev) => ({ ...prev, [qNum]: url }));
    };

    if (submitted) {
        return (
            <div className="success-screen">
                <div className="big-check">✓</div>
                <h2>All Done!</h2>
                <p>Your answers have been submitted successfully.</p>
                <p style={{ marginTop: "0.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
                    Results will be published after evaluation.
                </p>
            </div>
        );
    }

    return (
        <div className="test-container">
            <div className="test-header">
                <div className="user-info">
                    <strong>{name}</strong>
                    <br />
                    Batch: {batchNumber}
                </div>
                <button className="btn-logout" onClick={onLogout}>
                    Logout
                </button>
            </div>

            {QUESTIONS.map((q) => (
                <QuestionCard
                    key={q.id}
                    questionNumber={q.id}
                    questionText={q.text}
                    batchNumber={batchNumber}
                    onUploadComplete={handleUploadComplete}
                />
            ))}

            <div className="submit-bar">
                <span className="submit-status">
                    {Object.keys(uploadedMap).length}/{QUESTIONS.length} uploaded
                </span>
                <button
                    className="btn-submit"
                    disabled={!allUploaded}
                    onClick={() => setSubmitted(true)}
                >
                    Submit All
                </button>
            </div>
        </div>
    );
}
