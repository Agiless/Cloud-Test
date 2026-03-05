"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: "1rem"
    }}>
      <div style={{ textAlign: "center", padding: "3rem", background: "var(--input-bg)", borderRadius: "1rem", border: "1px solid var(--input-border)", maxWidth: "500px", width: "100%" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "1rem", color: "var(--foreground)" }}>📝 Class Test Concluded</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem", lineHeight: "1.6" }}>
          The test period has ended. No more uploads are being accepted at this time.
        </p>

        <Link href="/results" style={{
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
          View Leaderboard & Results →
        </Link>
      </div>
    </div>
  );
}
