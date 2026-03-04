"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface LeaderboardEntry {
    rank: number | string;
    batch: string;
    score: number | string;
    name?: string;
}

export default function ResultsPage() {
    const [batchNumber, setBatchNumber] = useState("");
    const [searched, setSearched] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (batchNumber.length === 6) {
            setSearched(true);
        }
    };

    const displayLeaderboard = [...leaderboard];
    const isUserInLeaderboard = displayLeaderboard.some(r => String(r.batch) === batchNumber);

    if (searched && !isUserInLeaderboard) {
        displayLeaderboard.push({
            rank: "-",
            batch: batchNumber,
            score: "Pending"
        });
    }

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: "500px", width: "100%" }}>
                <h1>📊 Check Results</h1>
                <p className="subtitle">Enter your batch number to view your rank</p>

                <form onSubmit={handleSearch}>
                    <div className="form-group">
                        <label htmlFor="batch">Batch Number</label>
                        <input
                            id="batch"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="e.g. 123456"
                            value={batchNumber}
                            onChange={(e) => {
                                setBatchNumber(e.target.value.replace(/\D/g, ""));
                                setSearched(false);
                            }}
                            autoComplete="off"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={batchNumber.length !== 6}>
                        View Results
                    </button>
                </form>

                {searched && (
                    <div style={{ marginTop: "2rem" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem", color: "var(--foreground)" }}>
                            Leaderboard
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {displayLeaderboard.length === 1 && !isUserInLeaderboard && (
                                <p style={{ color: "var(--muted)", textAlign: "center", padding: "1rem", fontSize: "0.9rem" }}>
                                    No results have been published yet.
                                </p>
                            )}
                            {displayLeaderboard.map((result, idx) => {
                                const isHighlighted = String(result.batch) === batchNumber;
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            padding: "0.85rem 1rem",
                                            borderRadius: "0.5rem",
                                            background: isHighlighted ? "var(--accent-glow)" : "var(--input-bg)",
                                            border: isHighlighted ? "1px solid var(--accent)" : "1px solid var(--input-border)",
                                            color: isHighlighted ? "#fff" : "var(--foreground)",
                                            fontWeight: isHighlighted ? "600" : "400",
                                            transition: "all 0.2s",
                                            alignItems: "center"
                                        }}
                                    >
                                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                            <span style={{ color: isHighlighted ? "var(--accent)" : "var(--muted)", width: "30px", fontWeight: "bold" }}>
                                                {result.rank !== "-" ? `#${result.rank}` : "-"}
                                            </span>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                {result.name && (
                                                    <span style={{ fontSize: "0.95rem" }}>{result.name}</span>
                                                )}
                                                <span style={{ fontSize: "0.8rem", color: isHighlighted ? "#ddd" : "var(--muted)" }}>
                                                    Batch: {result.batch}
                                                </span>
                                            </div>
                                        </div>
                                        <span style={{ color: isHighlighted ? "#fff" : "var(--muted)", fontSize: "1.1rem" }}>
                                            {result.score} {typeof result.score === "number" ? <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>pts</span> : ""}
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
