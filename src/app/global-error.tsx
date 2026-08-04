"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#08090a",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <section
            style={{
              maxWidth: 520,
              border: "1px solid #383b3f",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 24 }}>
              The application shell could not load.
            </h1>
            <p style={{ color: "#b8bdc5", lineHeight: 1.5 }}>
              Reload the application. Recipes and Baking Day sessions saved in
              this browser are not erased by this recovery step.
            </p>
            <button
              onClick={reset}
              style={{
                border: 0,
                borderRadius: 6,
                background: "#e4f222",
                color: "#08090a",
                padding: "10px 14px",
                fontWeight: 600,
              }}
            >
              Reload application
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
