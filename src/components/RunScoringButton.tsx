"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ScoringResult = {
  processed?: number;
  updated?: number;
  failed?: number;
  errors?: string[];
  error?: string;
};

export function RunScoringButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRunScoring() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/scoring/run", { method: "POST" });
      const data = (await res.json()) as ScoringResult;

      if (!res.ok) {
        setMessage(data.error ?? `Request failed (${res.status})`);
        return;
      }

      const parts = [
        `Processed ${data.processed ?? 0}`,
        `updated ${data.updated ?? 0}`,
        `failed ${data.failed ?? 0}`
      ];
      let text = parts.join(", ") + ".";
      if (data.errors?.length) {
        text += ` First errors: ${data.errors.slice(0, 3).join("; ")}`;
      }
      setMessage(text);
      router.refresh();
    } catch {
      setMessage("Network error while running scoring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inlineActions">
      <button type="button" onClick={() => void handleRunScoring()} disabled={loading}>
        {loading ? "Running..." : "Run Scoring"}
      </button>
      {message ? <p className="subtitle compact">{message}</p> : null}
    </div>
  );
}
