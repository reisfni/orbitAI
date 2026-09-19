"use client";

import { useEffect, useState } from "react";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setHasKey(Boolean(data.hasAnthropicApiKey)))
      .catch(() => setHasKey(false));
  }, []);

  const save = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicApiKey: keyInput }),
      });
      const data = await res.json();
      setHasKey(Boolean(data.hasAnthropicApiKey));
      setKeyInput("");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--oa-overlay)]" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-[var(--oa-border)] bg-[var(--oa-surface)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-sm font-medium text-[var(--oa-text)]">Settings</h2>
        <p className="mb-4 text-xs text-[var(--oa-text-muted)]">
          Used to run the Claude Code and OpenCode agent presets. Stored locally in{" "}
          <code className="rounded bg-[var(--oa-hover)] px-1 py-0.5">.orbitai/settings.json</code>, never committed.
        </p>

        <label className="mb-1 block text-xs text-[var(--oa-text-muted)]">Anthropic API key</label>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={hasKey ? "•••••••••••••••• (saved)" : "sk-ant-..."}
          className="mb-3 w-full rounded border border-[var(--oa-border)] bg-[var(--oa-hover)] px-2 py-1.5 text-sm text-[var(--oa-text)] outline-none focus:border-[var(--oa-text-dim)]"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--oa-text-dim)]">
            {hasKey === null ? "" : hasKey ? "A key is currently saved." : "No key saved yet."}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded px-3 py-1.5 text-xs text-[var(--oa-text-muted)] hover:bg-[var(--oa-surface-2-hover)]"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="rounded bg-[var(--oa-text)] px-3 py-1.5 text-xs font-medium text-[var(--oa-surface)] hover:opacity-90 disabled:opacity-50"
              onClick={save}
              disabled={status === "saving" || keyInput.length === 0}
            >
              {status === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {status === "error" && <p className="mt-2 text-xs text-red-400">Failed to save. Try again.</p>}
      </div>
    </div>
  );
}
