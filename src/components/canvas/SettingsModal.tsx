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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-zinc-700/60 bg-[#18181b] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-sm font-medium text-zinc-100">Settings</h2>
        <p className="mb-4 text-xs text-zinc-400">
          Used to run the Claude Code and OpenCode agent presets. Stored locally in{" "}
          <code className="rounded bg-black/40 px-1 py-0.5">.orbitai/settings.json</code>, never committed.
        </p>

        <label className="mb-1 block text-xs text-zinc-400">Anthropic API key</label>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={hasKey ? "•••••••••••••••• (saved)" : "sk-ant-..."}
          className="mb-3 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {hasKey === null ? "" : hasKey ? "A key is currently saved." : "No key saved yet."}
          </span>
          <div className="flex gap-2">
            <button className="rounded px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700" onClick={onClose}>
              Close
            </button>
            <button
              className="rounded bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
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
