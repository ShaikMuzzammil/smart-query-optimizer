"use client";
// app/global-error.tsx
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ background: "#030309", color: "#e2e8f0", fontFamily: "sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Application Error</h1>
          <p style={{ color: "#94a3b8", marginBottom: 16 }}>A critical error occurred. Please reload the page.</p>
          <button onClick={reset} style={{ padding: "10px 20px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
