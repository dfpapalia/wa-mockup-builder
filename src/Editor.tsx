import { ChevronDown, ChevronUp, Copy, Download, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { messageTypeLabels, normalizeTime, uid, type CarouselCard, type CtaButton, type ListItem, type Message, type MessageType, type PersistedState } from "./model";

const EMOJIS = ["😀", "😂", "🥰", "👍", "🙏", "🎉", "✨", "🔥", "✅", "❌", "📱", "📦", "🛍️", "🔗", "📞", "🚀"];
const classes = (...items: Array<string | false | undefined>) => items.filter(Boolean).join(" ");
const USE_CASE_TEMPLATES = [
  { path: "examples/use-case-1-first-party-data.json", label: "1 · First-party data acquisition" },
  { path: "examples/use-case-2-progressive-profiling.json", label: "2 · Progressive profiling" },
  { path: "examples/use-case-3-marketing-campaign.json", label: "3 · Marketing campaign" },
  { path: "examples/use-case-4-menu-bot.json", label: "4 · Menu-based bot" },
];

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "url" | "tel";
};

function TextField({ label, value, onChange, placeholder, multiline, type = "text" }: TextFieldProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const inputClass = "min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] text-slate-900 outline-none placeholder:text-slate-400";
  return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span><span className="relative flex items-start overflow-visible rounded-xl border border-slate-200 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">{multiline ? <textarea className={`${inputClass} min-h-20 resize-y`} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /> : <input className={inputClass} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}<button className="m-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm hover:bg-emerald-50" type="button" aria-label={`Add emoji to ${label}`} onClick={() => setShowEmoji((open) => !open)}>😊</button>{showEmoji && <span className="absolute right-0 top-full z-30 mt-1 grid w-48 grid-cols-8 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">{EMOJIS.map((emoji) => <button key={emoji} type="button" className="grid h-7 w-7 place-items-center rounded-md hover:bg-slate-100" onClick={() => { onChange(`${value}${emoji}`); setShowEmoji(false); }}>{emoji}</button>)}</span>}</span></label>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-emerald-500" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

async function toDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

function MediaField({ label, accept, value, onChange }: { label: string; accept: string; value: string; onChange: (value: string) => void }) {
  return <div><div className="mb-1 text-[11px] font-semibold text-slate-600">{label}</div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs font-medium text-slate-600 hover:border-emerald-400 hover:bg-emerald-50"><Upload size={15} />{value ? "Replace file" : "Choose file"}<input className="sr-only" type="file" accept={accept} onChange={async (event) => { const file = event.target.files?.[0]; if (file) onChange(await toDataUrl(file)); }} /></label>{value && <button type="button" className="mt-1 text-[11px] font-medium text-red-600" onClick={() => onChange("")}>Remove uploaded file</button>}</div>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">{children}</div>;
}

function ListEditor({ message, update }: { message: Extract<Message, { type: "list" }>; update: (patch: Partial<Message>) => void }) {
  const updateItem = (id: string, patch: Partial<ListItem>) => update({ items: message.items.map((item) => item.id === id ? { ...item, ...patch } : item) } as Partial<Message>);
  return <div className="space-y-3"><TextField label="Message" value={message.prompt} onChange={(prompt) => update({ prompt } as Partial<Message>)} multiline /><TextField label="Section title" value={message.sectionTitle} onChange={(sectionTitle) => update({ sectionTitle } as Partial<Message>)} /><TextField label="Footer action" value={message.buttonLabel} onChange={(buttonLabel) => update({ buttonLabel } as Partial<Message>)} /><Card><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">List items</span><button type="button" className="mini-primary" onClick={() => update({ items: [...message.items, { id: uid("item"), emoji: "✨", title: "New item", description: "Description" }] } as Partial<Message>)}><Plus size={13} /> Item</button></div><div className="space-y-3">{message.items.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-2.5"><div className="grid grid-cols-[70px_1fr] gap-2"><TextField label="Emoji" value={item.emoji} onChange={(emoji) => updateItem(item.id, { emoji })} /><TextField label="Title" value={item.title} onChange={(title) => updateItem(item.id, { title })} /></div><div className="mt-2 flex items-end gap-2"><span className="flex-1"><TextField label="Description" value={item.description} onChange={(description) => updateItem(item.id, { description })} /></span><button type="button" className="icon-danger" aria-label="Delete list item" onClick={() => update({ items: message.items.filter((candidate) => candidate.id !== item.id) } as Partial<Message>)}><Trash2 size={15} /></button></div></div>)}</div></Card></div>;
}

function CtaEditor({ message, update }: { message: Extract<Message, { type: "cta" }>; update: (patch: Partial<Message>) => void }) {
  const updateButton = (id: string, patch: Partial<CtaButton>) => update({ buttons: message.buttons.map((button) => button.id === id ? { ...button, ...patch } : button) } as Partial<Message>);
  return <div className="space-y-3"><TextField label="Message" value={message.text} onChange={(text) => update({ text } as Partial<Message>)} multiline /><Card><div className="mb-2 flex items-center justify-between"><span><span className="block text-xs font-semibold">CTA buttons</span><span className="text-[10px] text-slate-500">Up to two actions</span></span><button type="button" disabled={message.buttons.length >= 2} className="mini-primary disabled:opacity-40" onClick={() => update({ buttons: [...message.buttons, { id: uid("cta"), kind: "url", label: "Open link", value: "https://example.com" }] } as Partial<Message>)}><Plus size={13} /> Action</button></div><div className="space-y-3">{message.buttons.map((button) => <div key={button.id} className="rounded-xl border border-slate-200 bg-white p-2.5"><div className="grid grid-cols-2 gap-2"><SelectField label="Action type" value={button.kind} onChange={(kind) => updateButton(button.id, { kind: kind as CtaButton["kind"] })}><option value="url">🔗 Website link</option><option value="phone">📞 Phone call</option></SelectField><TextField label="Button label" value={button.label} onChange={(label) => updateButton(button.id, { label })} /></div><div className="mt-2 flex items-end gap-2"><span className="flex-1"><TextField label={button.kind === "url" ? "URL" : "Phone number"} type={button.kind === "url" ? "url" : "tel"} value={button.value} onChange={(value) => updateButton(button.id, { value })} /></span><button type="button" className="icon-danger" aria-label="Delete CTA" onClick={() => update({ buttons: message.buttons.filter((candidate) => candidate.id !== button.id) } as Partial<Message>)}><Trash2 size={15} /></button></div></div>)}</div></Card></div>;
}

function CarouselEditor({ message, update }: { message: Extract<Message, { type: "carousel" }>; update: (patch: Partial<Message>) => void }) {
  const updateCard = (id: string, patch: Partial<CarouselCard>) => update({ cards: message.cards.map((card) => card.id === id ? { ...card, ...patch } : card) } as Partial<Message>);
  return <div className="space-y-3"><TextField label="Intro message" value={message.intro} onChange={(intro) => update({ intro } as Partial<Message>)} multiline /><Card><div className="mb-2 flex items-center justify-between"><span><span className="block text-xs font-semibold">Product cards</span><span className="text-[10px] text-slate-500">1–3 cards, one product CTA each</span></span><button type="button" disabled={message.cards.length >= 3} className="mini-primary disabled:opacity-40" onClick={() => update({ cards: [...message.cards, { id: uid("card"), imageUrl: "", title: "New product", body: "Product description", ctaLabel: "View product", productUrl: "https://example.com/product" }] } as Partial<Message>)}><Plus size={13} /> Card</button></div><div className="space-y-4">{message.cards.map((card, index) => <div key={card.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">Card {index + 1}</span><button type="button" className="text-red-600" aria-label="Delete carousel card" onClick={() => update({ cards: message.cards.filter((candidate) => candidate.id !== card.id) } as Partial<Message>)}><Trash2 size={15} /></button></div><div className="space-y-2"><MediaField label="Product image" accept="image/*" value={card.imageUrl.startsWith("data:") ? card.imageUrl : ""} onChange={(imageUrl) => updateCard(card.id, { imageUrl })} /><TextField label="Or image URL" value={card.imageUrl.startsWith("data:") ? "" : card.imageUrl} type="url" onChange={(imageUrl) => updateCard(card.id, { imageUrl })} /><TextField label="Product title" value={card.title} onChange={(title) => updateCard(card.id, { title })} /><TextField label="Description" value={card.body} onChange={(body) => updateCard(card.id, { body })} multiline /><div className="grid grid-cols-2 gap-2"><TextField label="CTA label" value={card.ctaLabel} onChange={(ctaLabel) => updateCard(card.id, { ctaLabel })} /><TextField label="Product URL" value={card.productUrl} type="url" onChange={(productUrl) => updateCard(card.id, { productUrl })} /></div></div></div>)}</div></Card></div>;
}

function OptionsEditor({ title, values, onChange }: { title: string; values: string[]; onChange: (values: string[]) => void }) {
  return <Card><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">{title}</span><button type="button" className="mini-primary" onClick={() => onChange([...values, "✨ New option"])}><Plus size={13} /> Option</button></div><div className="space-y-2">{values.map((value, index) => <div key={index} className="flex items-end gap-2"><span className="flex-1"><TextField label={`Option ${index + 1}`} value={value} onChange={(next) => onChange(values.map((candidate, candidateIndex) => candidateIndex === index ? next : candidate))} /></span><button type="button" className="icon-danger" aria-label="Delete option" onClick={() => onChange(values.filter((_, candidateIndex) => candidateIndex !== index))}><Trash2 size={15} /></button></div>)}</div></Card>;
}

function MessageFields({ message, update }: { message: Message; update: (patch: Partial<Message>) => void }) {
  switch (message.type) {
    case "text": return <TextField label="Message" value={message.text} onChange={(text) => update({ text } as Partial<Message>)} multiline />;
    case "media_image": return <div className="space-y-3"><MediaField label="Image" accept="image/*" value={message.dataUrl} onChange={(dataUrl) => update({ dataUrl } as Partial<Message>)} /><TextField label="Caption" value={message.caption} onChange={(caption) => update({ caption } as Partial<Message>)} multiline /></div>;
    case "media_video": return <div className="space-y-3"><MediaField label="Video" accept="video/*" value={message.dataUrl} onChange={(dataUrl) => update({ dataUrl } as Partial<Message>)} /><TextField label="Caption" value={message.caption} onChange={(caption) => update({ caption } as Partial<Message>)} multiline /></div>;
    case "media_pdf": return <div className="grid grid-cols-2 gap-2"><TextField label="Filename" value={message.filename} onChange={(filename) => update({ filename } as Partial<Message>)} /><TextField label="Size label" value={message.sizeLabel} onChange={(sizeLabel) => update({ sizeLabel } as Partial<Message>)} /></div>;
    case "audio": return <div className="space-y-3"><MediaField label="Audio" accept="audio/*" value={message.dataUrl} onChange={(dataUrl) => update({ dataUrl } as Partial<Message>)} /><TextField label="Duration" value={message.durationLabel} onChange={(durationLabel) => update({ durationLabel } as Partial<Message>)} /></div>;
    case "link": return <div className="space-y-3"><TextField label="Link URL" type="url" value={message.url} onChange={(url) => update({ url } as Partial<Message>)} /><TextField label="Preview title" value={message.title} onChange={(title) => update({ title } as Partial<Message>)} /><TextField label="Description" value={message.description} onChange={(description) => update({ description } as Partial<Message>)} multiline /><TextField label="Thumbnail URL (optional)" type="url" value={message.thumbnailUrl} onChange={(thumbnailUrl) => update({ thumbnailUrl } as Partial<Message>)} /></div>;
    case "quick_reply": return <div className="space-y-3"><TextField label="Prompt" value={message.prompt} onChange={(prompt) => update({ prompt } as Partial<Message>)} multiline /><OptionsEditor title="Quick replies" values={message.options} onChange={(options) => update({ options } as Partial<Message>)} /></div>;
    case "list": return <ListEditor message={message} update={update} />;
    case "cta": return <CtaEditor message={message} update={update} />;
    case "carousel": return <CarouselEditor message={message} update={update} />;
    case "flow": return <div className="space-y-3"><TextField label="Flow title" value={message.title} onChange={(title) => update({ title } as Partial<Message>)} /><TextField label="Description" value={message.body} onChange={(body) => update({ body } as Partial<Message>)} multiline /><OptionsEditor title="Field labels" values={message.fields.map((field) => field.label)} onChange={(labels) => update({ fields: labels.map((label, index) => message.fields[index] ? { ...message.fields[index], label } : { id: uid("field"), label, required: false, fieldType: "text", placeholder: "Type here" }) } as Partial<Message>)} /><TextField label="Submit label" value={message.submitLabel} onChange={(submitLabel) => update({ submitLabel } as Partial<Message>)} /></div>;
    case "multiselect": return <div className="space-y-3"><TextField label="Prompt" value={message.prompt} onChange={(prompt) => update({ prompt } as Partial<Message>)} multiline /><OptionsEditor title="Options" values={message.options.map((option) => option.label)} onChange={(labels) => update({ options: labels.map((label, index) => ({ id: message.options[index]?.id ?? uid("option"), label })) } as Partial<Message>)} /><TextField label="Submit label" value={message.submitLabel} onChange={(submitLabel) => update({ submitLabel } as Partial<Message>)} /></div>;
  }
}

export function MessageEditor({ selected, onAdd, onUpdate, onDelete }: { selected: Message | null; onAdd: (type: MessageType) => void; onUpdate: (patch: Partial<Message>) => void; onDelete: () => void }) {
  return <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Build</span><h2>Message editor</h2></div></div><div className="p-4"><div className="grid grid-cols-3 gap-2">{(Object.keys(messageTypeLabels) as MessageType[]).map((type) => <button key={type} type="button" onClick={() => onAdd(type)} className="type-button"><span className="text-lg">{messageTypeLabels[type].emoji}</span><span>{messageTypeLabels[type].label}</span></button>)}</div>{selected ? <div className="mt-5 border-t border-slate-200 pt-4"><div className="mb-3 flex items-center justify-between"><div><div className="text-xs font-semibold text-slate-900">{messageTypeLabels[selected.type].emoji} {messageTypeLabels[selected.type].label}</div><div className="text-[10px] text-slate-500">Selected message</div></div><button type="button" className="icon-danger" aria-label="Delete selected message" onClick={onDelete}><Trash2 size={15} /></button></div><div className="mb-3 grid grid-cols-2 gap-2"><SelectField label="From" value={selected.from} onChange={(from) => onUpdate({ from: from as Message["from"] })}><option value="them">🤖 Business</option><option value="me">👤 Customer</option></SelectField><TextField label="Time" value={selected.time} onChange={(time) => onUpdate({ time })} /></div><div onBlur={() => onUpdate({ time: normalizeTime(selected.time) })}><MessageFields message={selected} update={onUpdate} /></div></div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">Select a message in the preview or add a new one.</div>}</div></section>;
}

export function Timeline({ messages, selectedId, onSelect, onMove, onDelete }: { messages: Message[]; selectedId: string | null; onSelect: (id: string) => void; onMove: (index: number, direction: -1 | 1) => void; onDelete: (id: string) => void }) {
  return <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Sequence</span><h2>Conversation</h2></div><span className="count-pill">{messages.length}</span></div><div className="max-h-[760px] space-y-2 overflow-y-auto p-3">{messages.map((message, index) => <button key={message.id} type="button" onClick={() => onSelect(message.id)} className={classes("group flex w-full items-center gap-2 rounded-xl border p-2 text-left transition", selectedId === message.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300")}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100">{messageTypeLabels[message.type].emoji}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{messageTypeLabels[message.type].label}</span><span className="block truncate text-[10px] text-slate-500">{message.from === "me" ? "Customer" : "Business"} · {message.time}</span></span><span className="flex opacity-20 transition group-hover:opacity-100"><button type="button" aria-label="Move up" disabled={index === 0} className="timeline-icon" onClick={(event) => { event.stopPropagation(); onMove(index, -1); }}><ChevronUp size={13} /></button><button type="button" aria-label="Move down" disabled={index === messages.length - 1} className="timeline-icon" onClick={(event) => { event.stopPropagation(); onMove(index, 1); }}><ChevronDown size={13} /></button><button type="button" aria-label="Delete message" className="timeline-icon text-red-600" onClick={(event) => { event.stopPropagation(); onDelete(message.id); }}><Trash2 size={13} /></button></span></button>)}</div></section>;
}

type AssetMap = Record<string, string>;

function compactAssets(value: unknown) {
  const assets: AssetMap = {};
  const knownAssets = new Map<string, string>();
  let assetNumber = 0;
  const visit = (current: unknown): unknown => {
    if (typeof current === "string" && current.startsWith("data:")) {
      const knownToken = knownAssets.get(current);
      if (knownToken) return knownToken;
      const mediaKind = current.match(/^data:([^/;]+)/)?.[1] ?? "media";
      const token = `asset://${mediaKind}/${++assetNumber}`;
      assets[token] = current;
      knownAssets.set(current, token);
      return token;
    }
    if (Array.isArray(current)) return current.map(visit);
    if (current && typeof current === "object") return Object.fromEntries(Object.entries(current as Record<string, unknown>).map(([key, item]) => [key, visit(item)]));
    return current;
  };
  return { raw: JSON.stringify(visit(value), null, 2), assets };
}

function expandAssets(raw: string, assets: AssetMap) {
  const parsed: unknown = JSON.parse(raw);
  const visit = (current: unknown): unknown => {
    if (typeof current === "string" && current.startsWith("asset://")) {
      const asset = assets[current];
      if (!asset) throw new Error(`Unknown asset placeholder: ${current}. Use Refresh to restore it.`);
      return asset;
    }
    if (Array.isArray(current)) return current.map(visit);
    if (current && typeof current === "object") return Object.fromEntries(Object.entries(current as Record<string, unknown>).map(([key, item]) => [key, visit(item)]));
    return current;
  };
  return JSON.stringify(visit(parsed), null, 2);
}

export function JsonEditor({ state, onApply }: { state: PersistedState; onApply: (raw: string) => void }) {
  const initial = compactAssets(state);
  const [raw, setRaw] = useState(initial.raw);
  const [assets, setAssets] = useState<AssetMap>(initial.assets);
  const [notice, setNotice] = useState("");
  const [templatePath, setTemplatePath] = useState(USE_CASE_TEMPLATES[0]?.path ?? "");
  const refresh = () => { const next = compactAssets(state); setRaw(next.raw); setAssets(next.assets); setNotice("Editor refreshed from the current conversation."); };
  const getFullJson = () => expandAssets(raw, assets);
  const download = () => { const blob = new Blob([getFullJson()], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "whatsapp-conversation.json"; anchor.click(); URL.revokeObjectURL(url); };
  const importJson = async (file: File) => { const text = await file.text(); const next = compactAssets(JSON.parse(text)); setRaw(next.raw); setAssets(next.assets); setNotice("JSON imported with media links compacted."); };
  const loadTemplate = async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}${templatePath}`);
    if (!response.ok) throw new Error("The selected template could not be loaded.");
    const next = compactAssets(await response.json());
    setRaw(next.raw);
    setAssets(next.assets);
    setNotice("Use-case template loaded. Review the placeholders, then apply it.");
  };

  return <section className="panel">
    <div className="panel-heading"><div><span className="eyebrow">Advanced</span><h2>JSON schema editor</h2></div></div>
    <div className="space-y-3 p-4">
      <p className="text-[11px] leading-5 text-slate-500">Edit the complete conversation as JSON. Uploaded media is shown as a short <code className="rounded bg-slate-100 px-1 text-emerald-700">asset://image/1</code> placeholder; its full data stays intact and is restored when you apply, copy, or download.</p>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-emerald-800" htmlFor="use-case-template">Use-case template</label>
        <div className="flex gap-2">
          <select id="use-case-template" className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-2 py-2 text-[11px] text-slate-700 outline-none" value={templatePath} onChange={(event) => setTemplatePath(event.target.value)}>
            {USE_CASE_TEMPLATES.map((template) => <option key={template.path} value={template.path}>{template.label}</option>)}
          </select>
          <button type="button" className="mini-primary shrink-0" onClick={() => { loadTemplate().catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Could not load the template.")); }}>Load template</button>
        </div>
        <p className="mt-1.5 text-[10px] leading-4 text-emerald-700">Template variables use the <code>{"{{VariableName}}"}</code> format. Replace them manually or keep them visible in your mockup.</p>
      </div>
      <textarea aria-label="Conversation JSON" spellCheck={false} className="h-[470px] w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[10px] leading-4 text-emerald-300 outline-none focus:ring-2 focus:ring-emerald-300" value={raw} onChange={(event) => { setRaw(event.target.value); setNotice(""); }} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="secondary-button" onClick={refresh}>Refresh</button>
        <button type="button" className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(getFullJson()); setNotice("Full JSON copied with media included."); } catch (error) { setNotice(error instanceof Error ? error.message : "Invalid JSON."); } }}><Copy size={14} /> Copy full JSON</button>
        <button type="button" className="secondary-button" onClick={() => { try { download(); setNotice("Full JSON downloaded with media included."); } catch (error) { setNotice(error instanceof Error ? error.message : "Invalid JSON."); } }}><Download size={14} /> Download full JSON</button>
        <label className="secondary-button cursor-pointer"><Upload size={14} /> Import<input className="sr-only" type="file" accept="application/json,.json" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { try { await importJson(file); } catch (error) { setNotice(error instanceof Error ? error.message : "Invalid JSON file."); } } }} /></label>
      </div>
      <button type="button" className="primary-button w-full" onClick={() => { try { onApply(getFullJson()); setNotice("Conversation applied successfully; media data was preserved."); } catch (error) { setNotice(error instanceof Error ? error.message : "Invalid JSON."); } }}>Validate & apply JSON</button>
      {notice && <div className={classes("rounded-xl px-3 py-2 text-[11px]", notice.includes("success") || notice.includes("copied") || notice.includes("downloaded") || notice.includes("refreshed") || notice.includes("imported") || notice.includes("loaded") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>{notice}</div>}
    </div>
  </section>;
}

