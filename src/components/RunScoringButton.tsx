"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunScoringButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRunScoring() {
    setLoading(true);
    setMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 700));

    setLoading(false);
    setMessage("Scoring API will be connected later. Queue view refreshed.");
    router.refresh();
  }

  return (
    <div className="inlineActions">
      <button type="button" onClick={handleRunScoring} disabled={loading}>
        {loading ? "Running..." : "Run Scoring"}
      </button>
      {message ? <p className="subtitle compact">{message}</p> : null}
    </div>
  );
}
