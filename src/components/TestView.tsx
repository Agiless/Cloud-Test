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

            {/* TEST SECTION COMMENTED OUT 
            {QUESTIONS.map((q) => (
                <QuestionCard
                    key={q.id}
                    questionNumber={q.id}
                    questionText={q.text}
                    batchNumber={batchNumber}
                    name={name}
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
            */}

            <div style={{ marginTop: "2rem", textAlign: "center", padding: "3rem 1rem", background: "var(--input-bg)", borderRadius: "1rem", border: "1px solid var(--accent)" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--foreground)" }}>Evaluations are Ready</h2>
                <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>The test has concluded and results have been published.</p>
                <a href="/results" style={{
                    display: "inline-block",
                    padding: "1rem 2.5rem",
                    background: "var(--accent)",
                    color: "white",
                    fontWeight: "600",
                    borderRadius: "0.5rem",
                    textDecoration: "none",
                    boxShadow: "0 0 15px var(--accent-glow)",
                    transition: "transform 0.2s"
                }}>
                    View Leaderboard & Results
                </a>
            </div>
        </div>
    );
}
