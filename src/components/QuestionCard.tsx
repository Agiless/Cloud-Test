"use client";

import { useState, useRef } from "react";

interface QuestionCardProps {
    questionNumber: number;
    questionText: string;
    batchNumber: string;
    name: string;
    onUploadComplete: (questionNumber: number, url: string) => void;
}

export default function QuestionCard({
    questionNumber,
    questionText,
    batchNumber,
    name,
    onUploadComplete,
}: QuestionCardProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (!selected.type.startsWith("image/")) {
            setError("Only image files are allowed");
            return;
        }
        if (selected.size > 10 * 1024 * 1024) {
            setError("File size must be under 10 MB");
            return;
        }

        setError(null);
        setFile(selected);
        setUploaded(false);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selected);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("batchNumber", batchNumber);
            formData.append("questionNumber", String(questionNumber));
            formData.append("name", name);

            setProgress(30);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            setProgress(80);

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setProgress(100);
            setUploaded(true);
            setUploading(false);
            onUploadComplete(questionNumber, data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setUploading(false);
            setProgress(0);
        }
    };

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        setProgress(0);
        setUploaded(false);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className={`question-card ${uploaded ? "uploaded" : ""}`}>
            <div className="question-number">Question {questionNumber}</div>
            <div className="question-text">{questionText}</div>

            {!preview && (
                <div className="upload-area">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                    />
                    <div className="upload-icon">📷</div>
                    <div className="upload-label">
                        <span>Tap to capture</span> or select an image
                    </div>
                </div>
            )}

            {preview && (
                <div className="upload-preview">
                    <img src={preview} alt={`Answer for question ${questionNumber}`} />
                    {!uploaded && (
                        <div className="upload-actions">
                            <button
                                className="btn-upload"
                                onClick={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? "Uploading…" : "Upload"}
                            </button>
                            <button
                                className="btn-remove"
                                onClick={handleRemove}
                                disabled={uploading}
                            >
                                Remove
                            </button>
                        </div>
                    )}
                    {uploading && (
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                    {uploaded && (
                        <div className="upload-success">
                            <span className="check-icon">✅</span> Uploaded successfully
                        </div>
                    )}
                </div>
            )}

            {error && <p className="error-text" style={{ marginTop: "0.5rem" }}>{error}</p>}
        </div>
    );
}
