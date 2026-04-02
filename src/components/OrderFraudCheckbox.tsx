"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: number;
  initialChecked: boolean;
};

export function OrderFraudCheckbox({ orderId, initialChecked }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialChecked);
  const [busy, setBusy] = useState(false);

  async function onChange(next: boolean) {
    setBusy(true);
    setChecked(next);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_fraud: next })
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch {
      setChecked(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="tableCheckboxLabel">
      <input
        type="checkbox"
        checked={checked}
        disabled={busy}
        onChange={(e) => void onChange(e.target.checked)}
        aria-label={`Mark order ${orderId} as fraud`}
      />
    </label>
  );
}
