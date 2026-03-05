"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface LeaderboardEntry {
    rank: number | string;
    batch: string;
    name?: string;
    score: number | string;
    feedback?: string;
}

interface DetailResult {
    publicId: string;
    imageUrl: string;
    score: number;
    correct_blocks: string[];
    missing_blocks: string[];
    incorrect_blocks: string[];
    sequence_correct: boolean;
    feedback: string;
    evaluatedAt: string;
}

interface BatchDetail {
    found: boolean;
    batch: string;
    studentName?: string;
    bestScore?: number;
    details: DetailResult[];
}

export default function ResultsPage() {
    const [batchNumber, setBatchNumber] = useState("");
    const [searched, setSearched] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [batchDetail, setBatchDetail] = useState<BatchDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch("/api/results");
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.leaderboard || []);
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
            }
        }
        fetchLeaderboard();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (batchNumber.length !== 6) return;

        setSearched(true);
        setLoading(true);
        setBatchDetail(null);

        try {
            const res = await fetch(`/api/results?batch=${batchNumber}`);
            if (res.ok) {
                const data = await res.json();
                setBatchDetail(data);
            }
        } catch (err) {
            console.error("Failed to fetch batch details", err);
        } finally {
            setLoading(false);
        }
    };

    const displayLeaderboard = [...leaderboard];
    const isUserInLeaderboard = displayLeaderboard.some((r) => String(r.batch) === batchNumber);

    if (searched && !isUserInLeaderboard) {
        displayLeaderboard.push({
            rank: "-",
            batch: batchNumber,
            score: "Pending",
        });
    }

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: "600px", width: "100%" }}>
                <h1>📊 Check Results</h1>
                <p className="subtitle">Enter your batch number to view your rank & details</p>

                <form onSubmit={handleSearch}>
                    <div className="form-group">
                        <label htmlFor="batch">Batch Number</label>
                        <input
                            id="batch"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="e.g. 261045"
                            value={batchNumber}
                            onChange={(e) => {
                                setBatchNumber(e.target.value.replace(/\D/g, ""));
                                setSearched(false);
                                setBatchDetail(null);
                            }}
                            autoComplete="off"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={batchNumber.length !== 6}>
                        View Results
                    </button>
                </form>

                {searched && loading && (
                    <p style={{ textAlign: "center", color: "var(--muted)", marginTop: "1.5rem" }}>Loading...</p>
                )}

                {/* Handle "not found" or custom message states (absent, organizer, not_in_class) */}
                {searched && !loading && batchDetail && batchDetail.found !== true && (
                    <div style={{
                        marginTop: "1.5rem",
                        padding: "1.5rem",
                        background: batchDetail.found === "organizer"
                            ? "rgba(251, 191, 36, 0.1)"
                            : batchDetail.found === "absent" || batchDetail.found === "not_in_class"
                                ? "rgba(239, 68, 68, 0.1)"
                                : "var(--input-bg)",
                        border: batchDetail.found === "organizer"
                            ? "1px solid rgba(251, 191, 36, 0.3)"
                            : batchDetail.found === "absent" || batchDetail.found === "not_in_class"
                                ? "1px solid rgba(239, 68, 68, 0.3)"
                                : "1px solid var(--input-border)",
                        borderRadius: "0.75rem",
                        textAlign: "center",
                    }}>
                        <p style={{
                            color: batchDetail.found === "organizer"
                                ? "#fbbf24"
                                : batchDetail.found === "absent" || batchDetail.found === "not_in_class"
                                    ? "#ef4444"
                                    : "var(--muted)",
                            fontSize: "1.1rem",
                            fontWeight: "500",
                        }}>
                            {batchDetail.message || "No results found for this batch number."}
                        </p>
                    </div>
                )}

                {/* Detailed result for found batch */}
                {searched && batchDetail && batchDetail.found === true && (
                    <div style={{ marginTop: "1.5rem" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem", color: "var(--accent)" }}>
                            📝 {batchDetail.studentName || batchDetail.batch} — Batch {batchDetail.batch}
                        </h2>
                        <div style={{
                            background: "var(--input-bg)",
                            border: "1px solid var(--accent)",
                            borderRadius: "0.75rem",
                            padding: "1rem",
                            marginBottom: "0.5rem",
                            fontSize: "1.1rem",
                            fontWeight: "600",
                            textAlign: "center",
                            color: "#fff",
                        }}>
                            Score: {batchDetail.bestScore} / 100
                        </div>

                        {batchDetail.details.map((detail, idx) => (
                            <div
                                key={idx}
                                style={{
                                    background: "var(--input-bg)",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "0.75rem",
                                    padding: "1rem",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                    <span style={{ fontWeight: "600", color: "var(--foreground)" }}>
                                        Score: {detail.score}/100
                                    </span>
                                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                                        {detail.sequence_correct ? "✅ Sequence Correct" : "❌ Sequence Wrong"}
                                    </span>
                                </div>

                                <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem", lineHeight: "1.4" }}>
                                    {detail.feedback}
                                </p>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    {detail.correct_blocks.length > 0 && (
                                        <div style={{ flex: "1 1 100%" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#4ade80", fontWeight: "600" }}>✓ Correct:</span>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.25rem" }}>
                                                {detail.correct_blocks.map((b, i) => (
                                                    <span key={i} style={{
                                                        fontSize: "0.7rem", background: "rgba(74,222,128,0.15)",
                                                        color: "#4ade80", padding: "0.15rem 0.5rem", borderRadius: "0.25rem"
                                                    }}>{b}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {detail.missing_blocks.length > 0 && (
                                        <div style={{ flex: "1 1 100%" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: "600" }}>✗ Missing:</span>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.25rem" }}>
                                                {detail.missing_blocks.map((b, i) => (
                                                    <span key={i} style={{
                                                        fontSize: "0.7rem", background: "rgba(248,113,113,0.15)",
                                                        color: "#f87171", padding: "0.15rem 0.5rem", borderRadius: "0.25rem"
                                                    }}>{b}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {detail.incorrect_blocks.length > 0 && (
                                        <div style={{ flex: "1 1 100%" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: "600" }}>⚠ Incorrect:</span>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.25rem" }}>
                                                {detail.incorrect_blocks.map((b, i) => (
                                                    <span key={i} style={{
                                                        fontSize: "0.7rem", background: "rgba(251,191,36,0.15)",
                                                        color: "#fbbf24", padding: "0.15rem 0.5rem", borderRadius: "0.25rem"
                                                    }}>{b}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {searched && batchDetail && !batchDetail.found && (
                    <p style={{ textAlign: "center", color: "var(--muted)", marginTop: "1.5rem", fontSize: "0.9rem" }}>
                        No results found for batch {batchNumber}. Your evaluation may still be pending.
                    </p>
                )}

                {/* Leaderboard */}
                {searched && (!batchDetail || batchDetail.found !== "not_in_class") && (
                    <div style={{ marginTop: "2rem" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem", color: "var(--foreground)" }}>
                            🏆 Leaderboard
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {displayLeaderboard.length === 1 && !isUserInLeaderboard && (
                                <p style={{ color: "var(--muted)", textAlign: "center", padding: "1rem", fontSize: "0.9rem" }}>
                                    No results have been published yet.
                                </p>
                            )}
                            {displayLeaderboard.map((result, idx) => {
                                const isHighlighted = String(result.batch) === batchNumber;
                                const isAbsent = result.score === "Absent";
                                const isOrganizer = result.score === "Organizer";
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            padding: "0.85rem 1rem",
                                            borderRadius: "0.5rem",
                                            background: isOrganizer
                                                ? "rgba(251, 191, 36, 0.1)"
                                                : isAbsent
                                                    ? "rgba(239, 68, 68, 0.1)"
                                                    : isHighlighted
                                                        ? "var(--accent-glow)"
                                                        : "var(--input-bg)",
                                            border: isOrganizer
                                                ? "1px solid rgba(251, 191, 36, 0.3)"
                                                : isAbsent
                                                    ? "1px solid rgba(239, 68, 68, 0.3)"
                                                    : isHighlighted
                                                        ? "1px solid var(--accent)"
                                                        : "1px solid var(--input-border)",
                                            color: isOrganizer
                                                ? "#fbbf24"
                                                : isAbsent
                                                    ? "#ef4444"
                                                    : isHighlighted
                                                        ? "#fff"
                                                        : "var(--foreground)",
                                            fontWeight: isHighlighted || isOrganizer ? "600" : "400",
                                            transition: "all 0.2s",
                                            alignItems: "center",
                                            opacity: isAbsent ? 0.85 : 1,
                                        }}
                                    >
                                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                            <span
                                                style={{
                                                    color: isOrganizer
                                                        ? "#fbbf24"
                                                        : isAbsent
                                                            ? "#ef4444"
                                                            : isHighlighted
                                                                ? "var(--accent)"
                                                                : "var(--muted)",
                                                    width: "30px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {result.rank === "★" ? "★" : result.rank !== "-" ? `#${result.rank}` : "-"}
                                            </span>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontSize: "0.95rem", color: isOrganizer ? "#fbbf24" : isAbsent ? "#ef4444" : undefined }}>
                                                    {result.name || result.batch}
                                                </span>
                                                <span style={{ fontSize: "0.75rem", color: isOrganizer ? "#d97706" : isAbsent ? "#f87171" : isHighlighted ? "#ddd" : "var(--muted)" }}>
                                                    {result.batch}
                                                </span>
                                            </div>
                                        </div>
                                        <span style={{
                                            color: isOrganizer ? "#fbbf24" : isAbsent ? "#ef4444" : isHighlighted ? "#fff" : "var(--muted)",
                                            fontSize: "1.1rem",
                                            fontWeight: isAbsent || isOrganizer ? "600" : undefined,
                                        }}>
                                            {result.score}{" "}
                                            {typeof result.score === "number" ? (
                                                <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>pts</span>
                                            ) : (
                                                ""
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                    <Link href="/" style={{ color: "var(--accent)", fontSize: "0.85rem", textDecoration: "none" }}>
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
