"use client";

import { useState, useCallback, useRef } from "react";

export default function Base64ToSVG() {
  const [input, setInput] = useState("");
  const [svgOutput, setSvgOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [mode, setMode] = useState<"b64tosvg" | "svgtob64">("b64tosvg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convert = useCallback(() => {
    setError("");
    setSvgOutput("");
    setCopied(false);

    if (!input.trim()) {
      setError("Input tidak boleh kosong.");
      return;
    }

    try {
      if (mode === "b64tosvg") {
        // Strip data URI prefix if present
        let b64 = input.trim();
        if (b64.startsWith("data:")) {
          const commaIdx = b64.indexOf(",");
          if (commaIdx !== -1) b64 = b64.slice(commaIdx + 1);
        }
        const decoded = atob(b64);
        if (!decoded.trim().startsWith("<svg") && !decoded.includes("<svg")) {
          setError("Hasil decode bukan SVG yang valid. Pastikan input adalah Base64 dari file SVG.");
          return;
        }
        setSvgOutput(decoded);
      } else {
        // SVG to Base64
        const b64 = btoa(unescape(encodeURIComponent(input.trim())));
        setSvgOutput(`data:image/svg+xml;base64,${b64}`);
      }
    } catch {
      setError("Gagal mengkonversi. Pastikan input Base64 valid dan merupakan encode dari SVG.");
    }
  }, [input, mode]);

  const handleCopy = useCallback(() => {
    if (!svgOutput) return;
    navigator.clipboard.writeText(svgOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [svgOutput]);

  const handleDownload = useCallback(() => {
    if (!svgOutput || mode !== "b64tosvg") return;
    const blob = new Blob([svgOutput], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.svg";
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [svgOutput, mode]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    if (mode === "b64tosvg") {
      // Read as base64
      reader.onload = () => {
        const result = reader.result as string;
        const b64 = result.split(",")[1] || result;
        setInput(b64);
      };
      reader.readAsDataURL(file);
    } else {
      // Read SVG as text
      reader.onload = () => {
        setInput(reader.result as string);
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  }, [mode]);

  const handleClear = () => {
    setInput("");
    setSvgOutput("");
    setError("");
  };

  const switchMode = (m: "b64tosvg" | "svgtob64") => {
    setMode(m);
    setInput("");
    setSvgOutput("");
    setError("");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0c0c0f",
        fontFamily: "'IBM Plex Mono', 'Fira Mono', 'Courier New', monospace",
        color: "#e8e3d5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 0 60px",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&family=Space+Grotesk:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        ::selection { background: #f0c040; color: #0c0c0f; }

        textarea {
          resize: vertical;
          outline: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
        }
        textarea:focus {
          border-color: #f0c040 !important;
          box-shadow: 0 0 0 2px rgba(240,192,64,0.15);
        }

        .btn-primary {
          background: #f0c040;
          color: #0c0c0f;
          border: none;
          padding: 12px 32px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .btn-primary:hover { background: #ffd740; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }

        .btn-ghost {
          background: transparent;
          color: #888;
          border: 1px solid #333;
          padding: 10px 20px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .btn-ghost:hover { border-color: #f0c040; color: #f0c040; }

        .mode-tab {
          background: transparent;
          border: none;
          padding: 10px 24px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          color: #555;
          border-bottom: 2px solid transparent;
        }
        .mode-tab.active {
          color: #f0c040;
          border-bottom: 2px solid #f0c040;
        }
        .mode-tab:hover:not(.active) { color: #aaa; }

        .svg-preview-container {
          background: repeating-conic-gradient(#1a1a20 0% 25%, #111116 0% 50%)
            0 0 / 16px 16px;
          border: 1px solid #2a2a32;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 180px;
          overflow: auto;
          padding: 20px;
        }
        .svg-preview-container svg {
          max-width: 100%;
          max-height: 320px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeIn 0.25s ease forwards; }
      `}</style>

      {/* Header */}
      <header
        style={{
          width: "100%",
          borderBottom: "1px solid #1e1e26",
          padding: "28px 40px 20px",
          display: "flex",
          alignItems: "flex-end",
          gap: "16px",
          marginBottom: "48px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.2em",
              color: "#f0c040",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Dev Tool
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f5f0e8",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Base64 ⇄ SVG Converter
          </h1>
        </div>
      </header>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "860px",
          padding: "0 20px",
        }}
      >
        {/* Mode Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #1e1e26",
            marginBottom: "32px",
          }}
        >
          <button
            className={`mode-tab ${mode === "b64tosvg" ? "active" : ""}`}
            onClick={() => switchMode("b64tosvg")}
          >
            Base64 → SVG
          </button>
          <button
            className={`mode-tab ${mode === "svgtob64" ? "active" : ""}`}
            onClick={() => switchMode("svgtob64")}
          >
            SVG → Base64
          </button>
        </div>

        {/* Input Section */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <label
              style={{
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#888",
              }}
            >
              {mode === "b64tosvg" ? "Input Base64" : "Input SVG"}
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                title="Upload file"
              >
                ↑ Upload
              </button>
              <button className="btn-ghost" onClick={handleClear}>
                ✕ Clear
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={mode === "b64tosvg" ? ".txt,.b64,*" : ".svg,image/svg+xml"}
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "b64tosvg"
                ? "Paste Base64 string di sini...\nContoh: PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=="
                : "Paste kode SVG di sini...\nContoh: <svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>"
            }
            rows={8}
            style={{
              width: "100%",
              background: "#111116",
              border: "1px solid #2a2a32",
              color: "#e8e3d5",
              padding: "16px",
              borderRadius: "2px",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          />

          {error && (
            <div
              className="animate-in"
              style={{
                marginTop: "10px",
                padding: "10px 14px",
                background: "rgba(255,80,80,0.08)",
                border: "1px solid rgba(255,80,80,0.3)",
                color: "#ff6b6b",
                fontSize: "12px",
                letterSpacing: "0.02em",
              }}
            >
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Convert Button */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
          <button className="btn-primary" onClick={convert}>
            {mode === "b64tosvg" ? "Decode → SVG" : "Encode → Base64"}
          </button>
        </div>

        {/* Output Section */}
        {svgOutput && (
          <div className="animate-in">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <label
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#888",
                }}
              >
                {mode === "b64tosvg" ? "Output SVG" : "Output Base64"}
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-ghost" onClick={handleCopy}>
                  {copied ? "✓ Tersalin!" : "⎘ Copy"}
                </button>
                {mode === "b64tosvg" && (
                  <button className="btn-ghost" onClick={handleDownload}>
                    {downloaded ? "✓ Diunduh!" : "↓ Download .svg"}
                  </button>
                )}
              </div>
            </div>

            <textarea
              readOnly
              value={svgOutput}
              rows={7}
              style={{
                width: "100%",
                background: "#0d0d12",
                border: "1px solid #2a2a32",
                color: "#a8e6a3",
                padding: "16px",
                borderRadius: "2px",
                marginBottom: "20px",
              }}
            />

            {/* SVG Preview */}
            {mode === "b64tosvg" && (
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#888",
                    marginBottom: "10px",
                  }}
                >
                  Preview
                </div>
                <div
                  className="svg-preview-container"
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              </div>
            )}

            {mode === "svgtob64" && (
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#888",
                    marginBottom: "10px",
                  }}
                >
                  Preview (via data URI)
                </div>
                <div className="svg-preview-container">
                  <img
                    src={svgOutput}
                    alt="SVG Preview"
                    style={{ maxWidth: "100%", maxHeight: "320px" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Footer */}
        <div
          style={{
            marginTop: "48px",
            padding: "20px",
            borderTop: "1px solid #1e1e26",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            fontSize: "12px",
            color: "#555",
            lineHeight: "1.7",
          }}
        >
          <div>
            <div style={{ color: "#f0c040", marginBottom: "6px", letterSpacing: "0.1em" }}>
              BASE64 → SVG
            </div>
            Input string Base64 (dengan atau tanpa prefix <code style={{ color: "#aaa" }}>data:image/svg+xml;base64,</code>),
            tool akan decode dan menampilkan SVG beserta preview-nya.
          </div>
          <div>
            <div style={{ color: "#f0c040", marginBottom: "6px", letterSpacing: "0.1em" }}>
              SVG → BASE64
            </div>
            Paste kode SVG mentah, tool akan mengkonversi ke string Base64 dengan format
            data URI yang siap digunakan di CSS atau HTML.
          </div>
        </div>
      </div>
    </main>
  );
}
