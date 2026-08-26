import { Download, Github, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { JsonEditor, MessageEditor, Timeline } from "./Editor";
import { PhonePreview } from "./Preview";
import { STORAGE_KEY, createDefaultMessage, defaultState, loadState, parseState, type Message, type MessageType, type PersistedState } from "./model";

export default function App() {
  const [state, setState] = useState<PersistedState>(loadState);
  const [mode, setMode] = useState<"builder" | "json">("builder");
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Large media may exceed the browser quota. */ }
  }, [state]);

  const selected = useMemo(() => state.messages.find((message) => message.id === state.selectedMessageId) ?? null, [state.messages, state.selectedMessageId]);
  const updateMessage = (id: string, patch: Partial<Message>) => setState((current) => ({ ...current, messages: current.messages.map((message) => message.id === id ? { ...message, ...patch } as Message : message) }));
  const addMessage = (type: MessageType) => {
    const message = createDefaultMessage(type);
    setState((current) => ({ ...current, messages: [...current.messages, message], selectedMessageId: message.id }));
  };
  const deleteMessage = (id: string) => setState((current) => {
    const index = current.messages.findIndex((message) => message.id === id);
    const messages = current.messages.filter((message) => message.id !== id);
    return { ...current, messages, selectedMessageId: current.selectedMessageId === id ? messages[Math.max(0, index - 1)]?.id ?? null : current.selectedMessageId };
  });
  const moveMessage = (index: number, direction: -1 | 1) => setState((current) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= current.messages.length) return current;
    const messages = [...current.messages];
    const [message] = messages.splice(index, 1);
    if (!message) return current;
    messages.splice(nextIndex, 0, message);
    return { ...current, messages };
  });
  const exportPng = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#efeae2" });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = "whatsapp-mockup.png";
      anchor.click();
    } finally { setExporting(false); }
  };

  return <main className="min-h-screen"><header className="topbar"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-xl shadow-lg shadow-emerald-500/25">💬</span><span><span className="flex items-center gap-2"><h1 className="text-base font-bold tracking-tight text-white">WA Mockup Builder</h1><span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-200">Studio</span></span><span className="block text-[10px] text-slate-400">Design realistic WhatsApp conversations</span></span></div><div className="flex items-center gap-2"><a className="header-button hidden sm:flex" href="https://github.com/dfpapalia/wa-mockup-builder" target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a><button type="button" className="header-button" onClick={() => { if (window.confirm("Reset the conversation to the demo content?")) setState(defaultState()); }}><RotateCcw size={14} /><span className="hidden sm:inline">Reset</span></button><button type="button" className="export-button" disabled={exporting} onClick={exportPng}><Download size={14} />{exporting ? "Exporting…" : "Export PNG"}</button></div></div></header><div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6"><section className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 sm:flex-row sm:items-center"><div className="flex items-start gap-2"><Sparkles size={16} className="mt-0.5 text-emerald-600" /><div><div className="text-xs font-semibold text-emerald-950">Everything stays in your browser</div><div className="text-[10px] text-emerald-700">Create, reorder, export, and save conversations without a backend.</div></div></div><div className="inline-flex rounded-xl border border-emerald-200 bg-white p-1"><button type="button" className={mode === "builder" ? "mode-active" : "mode-button"} onClick={() => setMode("builder")}>Visual builder</button><button type="button" className={mode === "json" ? "mode-active" : "mode-button"} onClick={() => setMode("json")}>JSON editor</button></div></section><div className="workspace-grid"><aside>{mode === "builder" ? <MessageEditor selected={selected} onAdd={addMessage} onUpdate={(patch) => selected && updateMessage(selected.id, patch)} onDelete={() => selected && deleteMessage(selected.id)} /> : <JsonEditor state={state} onApply={(raw) => setState(parseState(JSON.parse(raw)))} />}</aside><section className="min-w-0"><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><span className="eyebrow">Live preview</span><h2 className="text-sm font-bold text-slate-900">WhatsApp conversation</h2></div><div className="grid grid-cols-2 gap-2"><label><span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">Contact</span><input className="meta-input" value={state.chatMeta.contactName} onChange={(event) => setState((current) => ({ ...current, chatMeta: { ...current.chatMeta, contactName: event.target.value } }))} /></label><label><span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">Status</span><input className="meta-input" value={state.chatMeta.statusLine} onChange={(event) => setState((current) => ({ ...current, chatMeta: { ...current.chatMeta, statusLine: event.target.value } }))} /></label></div></div><div ref={previewRef}><PhonePreview contactName={state.chatMeta.contactName} statusLine={state.chatMeta.statusLine} messages={state.messages} selectedId={state.selectedMessageId} onSelect={(selectedMessageId) => setState((current) => ({ ...current, selectedMessageId }))} onUpdate={updateMessage} /></div></section><aside><Timeline messages={state.messages} selectedId={state.selectedMessageId} onSelect={(selectedMessageId) => setState((current) => ({ ...current, selectedMessageId }))} onMove={moveMessage} onDelete={deleteMessage} /></aside></div></div><footer className="pb-6 text-center text-[10px] text-slate-400">Built for prototyping · No WhatsApp affiliation</footer></main>;
}

