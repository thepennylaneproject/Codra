// src/components/studio/PromptArchitectPanel.tsx
"use client";

import { useState } from "react";
import { useFlowStore } from "../../lib/flow/store";

const VOICES = ["Neutral modern", "Cinematic", "Playful", "Academic"];
const VIBES = ["Clarity", "Rebellion", "Warmth", "Precision"];

export default function PromptArchitectPanel() {
    const [basePrompt, setBasePrompt] = useState("");
    const [voice, setVoice] = useState<string>("Neutral modern");
    const [vibe, setVibe] = useState<string>("Clarity");
    const [styleTokens, setStyleTokens] = useState("cinematic, moody, editorial, grain");

    const { selectedNodeId, updateNode } = useFlowStore();

    function savePromptToNode() {
        if (!selectedNodeId) return;

        // later we can actually store the whole preset;
        // for now we just attach a fake template id and provider
        updateNode(selectedNodeId, {
            meta: {
                provider: "deepseek",
                promptTemplateId: "custom-preset",
            },
        });
    }

    return (
        <div className="flex flex-col gap-4 p-4 text-xs text-white/90">
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/60">
                    Base prompt
                </label>
                <textarea
                    value={basePrompt}
                    onChange={(e) => setBasePrompt(e.target.value)}
                    placeholder="Describe the asset: subject, mood, composition, usage..."
                    className="min-h-[96px] rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs outline-none focus:border-[var(--teal)]"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/60">
                        Voice
                    </label>
                    <select
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs outline-none focus:border-[var(--teal)]"
                    >
                        {VOICES.map((v) => (
                            <option key={v}>{v}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/60">
                        Vibe
                    </label>
                    <select
                        value={vibe}
                        onChange={(e) => setVibe(e.target.value)}
                        className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs outline-none focus:border-[var(--teal)]"
                    >
                        {VIBES.map((v) => (
                            <option key={v}>{v}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold tracking-[0.16em] uppercase text-white/60">
                    Style tokens
                </label>
                <input
                    value={styleTokens}
                    onChange={(e) => setStyleTokens(e.target.value)}
                    className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-[var(--teal)]"
                    placeholder="cinematic, moody, editorial, grain"
                />
                <p className="text-[10px] text-white/55">
                    These tokens are stitched into prompts for images, video, or copy.
                </p>
            </div>

            <div className="mt-2 flex gap-2">
                <button
                    type="button"
                    className="flex-1 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[11px] font-medium hover:border-white/50"
                    onClick={savePromptToNode}
                    disabled={!selectedNodeId}
                >
                    Save preset
                </button>
                <button
                    type="button"
                    className="flex-1 rounded-full bg-[var(--teal)] px-3 py-1.5 text-[11px] font-semibold text-[var(--ink)] hover:opacity-90 disabled:opacity-40"
                    disabled={!selectedNodeId}
                >
                    Send to Forge
                </button>
            </div>

            {!selectedNodeId && (
                <p className="mt-1 text-[10px] text-amber-300/80">
                    Select a node in the Flow canvas to attach this preset.
                </p>
            )}
        </div>
    );
}
