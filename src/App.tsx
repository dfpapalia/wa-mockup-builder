/* File: src/App.tsx
   Requires:
   - React + TypeScript
   - TailwindCSS
   - npm i html-to-image
*/
/// <reference types="react" />
import {
  Phone,
  MoreVertical,
  Download,
  FileText,
  Play,
  Check,
  CheckCheck,
  Paperclip,
  Mic,
  Smile,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

type Sender = "me" | "them";
type MessageType =
  | "text"
  | "media_image"
  | "media_pdf"
  | "audio"
  | "flow"
  | "quick_reply"
  | "multiselect";

type MessageBase = {
  id: string;
  type: MessageType;
  from: Sender;
  time: string; // "HH:MM"
  status?: "sent" | "delivered" | "read"; // NEW
};

type TextMessage = MessageBase & { type: "text"; text: string };

type ImageMessage = MessageBase & {
  type: "media_image";
  dataUrl: string;
  caption: string;
};

type PdfMessage = MessageBase & {
  type: "media_pdf";
  filename: string;
  sizeLabel: string;
};

type AudioMessage = MessageBase & {
  type: "audio";
  dataUrl: string;
  durationLabel: string;
};

type FlowFieldType = "text" | "email" | "phone" | "number" | "date" | "radio";

type FlowField = {
  id: string;
  label: string;
  required: boolean;
  fieldType: FlowFieldType;
  placeholder: string;
  options?: string[]; // NEW (used for radio)
  selectedIndex?: number | null; // NEW: which radio option is selected
};

type FlowMessage = MessageBase & {
  type: "flow";
  title: string;
  body: string;
  fields: FlowField[];
  submitLabel: string;
  submitted?: boolean; // NEW
};

type QuickReplyMessage = MessageBase & {
  type: "quick_reply";
  prompt: string;
  options: string[];
  selectedIndex?: number | null; // NEW
};

type MultiSelectMessage = MessageBase & {
  type: "multiselect";
  prompt: string;
  options: { id: string; label: string }[];
  submitLabel: string;
  selectedOptionIds?: string[]; // NEW
  submitted?: boolean; // NEW
};

type Message =
  | TextMessage
  | ImageMessage
  | PdfMessage
  | AudioMessage
  | FlowMessage
  | QuickReplyMessage
  | MultiSelectMessage;

type ChatMeta = {
  contactName: string;
  statusLine: string;
};

type PersistedState = {
  version: 1;
  chatMeta: ChatMeta;
  messages: Message[];
  selectedMessageId: string | null;
};

const STORAGE_KEY = "wa-mockup-builder:v1";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clampTimeHHMM(value: string): string {
  // Accepts "H:MM", "HH:MM", "HHMM" etc. and normalizes.
  const trimmed = value.trim();
  const m1 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  const m2 = trimmed.match(/^(\d{1,2})(\d{2})$/);
  let hh = 12;
  let mm = 0;
  if (m1) {
    hh = Number(m1[1]);
    mm = Number(m1[2]);
  } else if (m2) {
    hh = Number(m2[1]);
    mm = Number(m2[2]);
  } else {
    return "12:00";
  }
  if (Number.isNaN(hh) || Number.isNaN(mm)) return "12:00";
  hh = Math.max(0, Math.min(23, hh));
  mm = Math.max(0, Math.min(59, mm));
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function downloadBlobUrl(blobUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}

function nowHHMM(): string {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function createDefaultMessage(type: MessageType): Message {
  const base: MessageBase = {
    id: uid("msg"),
    type,
    from: "them",
    time: nowHHMM(),
  };

  switch (type) {
    case "text":
      return { ...base, type: "text", text: "Hello! This is a text message." };
    case "media_image":
      return {
        ...base,
        type: "media_image",
        dataUrl: "",
        caption: "Image caption (optional)",
      };
    case "media_pdf":
      return {
        ...base,
        type: "media_pdf",
        filename: "document.pdf",
        sizeLabel: "250 KB",
      };
    case "audio":
      return {
        ...base,
        type: "audio",
        dataUrl: "",
        durationLabel: "0:12",
      };
    case "flow":
      return {
        ...base,
        type: "flow",
        title: "Flow title",
        body: "Short description for the form flow.",
        fields: [
          {
            id: uid("fld"),
            label: "Full name",
            required: true,
            fieldType: "text",
            placeholder: "Type here",
          },
          {
            id: uid("fld"),
            label: "Email",
            required: false,
            fieldType: "email",
            placeholder: "name@example.com",
          },
          {
            id: uid("fld"),
            label: "Contact preference",
            required: true,
            fieldType: "radio",
            placeholder: "",
            options: ["WhatsApp", "Email", "Phone"],
            selectedIndex: null,
          },
        ],
        submitLabel: "Submit",
        submitted: false,
      };
    case "quick_reply":
      return {
        ...base,
        type: "quick_reply",
        prompt: "Choose an option:",
        options: ["Yes", "No", "Maybe"],
        selectedIndex: null,
      };
    case "multiselect":
      return {
        ...base,
        type: "multiselect",
        prompt: "Select all that apply:",
        options: [
          { id: uid("opt"), label: "Option A" },
          { id: uid("opt"), label: "Option B" },
          { id: uid("opt"), label: "Option C" },
        ],
        submitLabel: "Send selection",
        selectedOptionIds: [],
        submitted: false,
      };
    default:
      return { ...base, type: "text", text: "Unsupported type." };
  }
}

function safeParsePersisted(raw: PersistedState): PersistedState {
  if (!raw || raw.version !== 1) throw new Error("Bad state");
  return raw;
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function StatusTicks({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (!status) return null;

  if (status === "sent") {
    return <Check size={14} className="ml-1" />;
  }
  if (status === "delivered") {
    return <CheckCheck size={14} className="ml-1" />;
  }
  // read
  return <CheckCheck size={14} className="ml-1 text-sky-500" />;
}

function Bubble({
  from,
  children,
  time,
  status,
}: {
  from: Sender;
  children: React.ReactNode;
  time: string;
  status?: "sent" | "delivered" | "read";
}) {
  const isMe = from === "me";

  return (
    <div
      className={classNames(
        "flex w-full",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={classNames(
          "wa-bubble inline-block relative max-w-[82%] px-2.5 py-1.5 shadow-[0_1px_0_rgba(0,0,0,0.08)]",
          isMe
            ? "bg-[var(--wa-bubble-me)] rounded-lg rounded-tr-none"
            : "bg-[var(--wa-bubble-them)] rounded-lg rounded-tl-none",
        )}
      >
        <span
          className={classNames(
            "pointer-events-none absolute top-0 h-0 w-0",
            isMe
              ? "right-[-8px] border-b-[12px] border-b-transparent border-l-[8px] border-l-[var(--wa-bubble-me)]"
              : "left-[-8px] border-b-[12px] border-b-transparent border-r-[8px] border-r-[var(--wa-bubble-them)]",
          )}
        />
        <div className="text-[14px] leading-5 text-[var(--wa-text)]">
          {children}
        </div>

        <div className="mt-0.5 flex justify-end gap-1 text-[11px] text-[var(--wa-muted)]">
          <span>{time}</span>
          {isMe ? (
            <span className="ml-1 inline-flex items-center">
              <StatusTicks status={status ?? "sent"} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Header({ chatMeta }: { chatMeta: ChatMeta }) {
  return (
    <div className="flex items-center gap-3 bg-[var(--wa-green)] px-3 py-2.5 text-white">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
        {chatMeta.contactName.trim().slice(0, 1).toUpperCase() || "C"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold leading-tight">
          {chatMeta.contactName || "Contact"}
        </div>
        <div className="truncate text-[12px] text-white/75">
          {chatMeta.statusLine || "online"}
        </div>
      </div>
      <div className="flex items-center gap-3 text-white/85">
        <Phone size={18} />
        <MoreVertical size={18} />
      </div>
    </div>
  );
}

function PdfRow({
  filename,
  sizeLabel,
}: {
  filename: string;
  sizeLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">
          {filename || "file.pdf"}
        </div>
        <div className="text-[11px] text-slate-500">{sizeLabel || ""}</div>
      </div>
      <div className="text-slate-500">
        <Download size={16} />
      </div>
    </div>
  );
}

function AudioRow({
  durationLabel,
  dataUrl,
}: {
  durationLabel: string;
  dataUrl: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
        <Play size={16} />
      </div>
      <div className="h-2 flex-1 rounded-full bg-slate-200" />
      <div className="text-[11px] text-slate-600">
        {durationLabel || "0:00"}
      </div>
      {/* Real audio element kept hidden; the mock UI is the point */}
      {dataUrl ? <audio className="hidden" src={dataUrl} /> : null}
    </div>
  );
}

function FlowCard({
  title,
  body,
  fields,
  submitLabel,
  submitted = false,
  onSubmit,
  onSelectRadio,
}: FlowMessage & {
  onSubmit: () => void;
  onSelectRadio: (fieldId: string, optionIndex: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="text-[13px] font-semibold">{title || "Flow"}</div>
        {body ? (
          <div className="mt-0.5 text-[11px] text-slate-600">{body}</div>
        ) : null}
      </div>
      <div className="px-3 py-2">
        <div className="space-y-2">
          {fields.length ? (
            fields.map((f) => (
              <div key={f.id} className="rounded-xl bg-slate-50 px-2 py-2">
                <div className="flex items-center justify-between text-[11px] text-slate-700">
                  <span className="font-medium">{f.label || "Field"}</span>
                  <span className="text-slate-500">
                    {f.fieldType === "radio" ? "select" : f.fieldType}
                    {f.required ? " *" : ""}
                  </span>
                </div>

                {f.fieldType === "radio" ? (
                  <div className="mt-2 space-y-1">
                    {(f.options?.length
                      ? f.options
                      : ["Option 1", "Option 2"]
                    ).map((opt, idx) => {
                      const checked = (f.selectedIndex ?? null) === idx;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={submitted}
                          onClick={() => onSelectRadio(f.id, idx)}
                          className={classNames(
                            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left",
                            submitted ? "opacity-80" : "hover:bg-white",
                          )}
                        >
                          <div
                            className={classNames(
                              "h-4 w-4 rounded-full border flex items-center justify-center",
                              checked
                                ? "border-[var(--wa-accent)]"
                                : "border-slate-300",
                            )}
                          >
                            {checked ? (
                              <div className="h-2 w-2 rounded-full bg-[var(--wa-accent)]" />
                            ) : null}
                          </div>
                          <span className="text-[12px] text-slate-700">
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-slate-500">
                    {f.placeholder || ""}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-[12px] text-slate-500">No fields</div>
          )}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitted}
          className={classNames(
            "mt-3 w-full rounded-xl px-3 py-2 text-[12px] font-semibold text-white",
            submitted
              ? "bg-slate-400"
              : "bg-[var(--wa-accent)] hover:brightness-95",
          )}
        >
          {submitted ? "Submitted" : submitLabel || "Submit"}
        </button>
      </div>
    </div>
  );
}

function BubbleWithActionsWidth({
  bubble,
  actions,
  align,
}: {
  bubble: React.ReactNode;
  actions: React.ReactNode;
  align: "left" | "right";
}) {
  const bubbleWrapRef = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const root = bubbleWrapRef.current;
    if (!root) return;

    const measure = () => {
      const bubbleEl = root.querySelector(".wa-bubble") as HTMLElement | null;
      const width = bubbleEl?.getBoundingClientRect().width;
      setW(width ?? null);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(root);

    // also observe the actual bubble node if present (more accurate)
    const bubbleEl = root.querySelector(".wa-bubble") as HTMLElement | null;
    if (bubbleEl) ro.observe(bubbleEl);

    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={
        align === "right"
          ? "flex flex-col items-end"
          : "flex flex-col items-start"
      }
    >
      <div ref={bubbleWrapRef} className="w-full">
        {bubble}
      </div>

      <div style={{ width: w ?? undefined }} className="mt-2 min-w-0">
        {actions}
      </div>
    </div>
  );
}

function QuickReplyButtons({
  options,
  selectedIndex,
  onSelect,
}: {
  options: string[];
  selectedIndex?: number | null;
  onSelect: (idx: number) => void;
}) {
  const opts = (options || []).filter(Boolean);
  const cols = opts.length === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className={classNames("grid", cols, "gap-2")}>
      {opts.map((o, idx) => {
        const selected = selectedIndex === idx;

        return (
          <button
            key={`${o}_${idx}`}
            type="button"
            onClick={() => onSelect(idx)}
            className={classNames(
              "w-full rounded-xl px-3 py-2 text-[14px] font-medium border",
              "shadow-[0_1px_0_rgba(0,0,0,0.10)]",
              selected
                ? "bg-slate-50 border-slate-200 text-slate-400"
                : "bg-slate-50 border-slate-200 text-[#128C7E] hover:bg-slate-100",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectCard({
  prompt,
  options,
  submitLabel,
  selectedOptionIds = [],
  submitted = false,
  onToggle,
  onSubmit,
}: MultiSelectMessage & {
  onToggle: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      {prompt ? <div className="mb-2 text-[13px]">{prompt}</div> : null}
      <div className="space-y-2">
        {options.length ? (
          options.map((o) => {
            const checked = selectedOptionIds.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                disabled={submitted}
                onClick={() => onToggle(o.id)}
                className={classNames(
                  "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition",
                  submitted ? "opacity-80" : "hover:bg-slate-50",
                  checked ? "bg-[rgba(37,211,102,0.10)]" : "bg-slate-50",
                )}
              >
                <div
                  className={classNames(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    checked
                      ? "border-[var(--wa-accent)] bg-[var(--wa-accent)] text-white"
                      : "border-slate-300 bg-white",
                  )}
                >
                  {checked ? <Check size={12} /> : null}
                </div>
                <div className="text-[12px] text-slate-800">
                  {o.label || "Option"}
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-[12px] text-slate-500">No options</div>
        )}
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitted}
        className={classNames(
          "mt-3 w-full rounded-xl px-3 py-2 text-[12px] font-semibold text-white",
          submitted ? "bg-slate-400" : "bg-[#128C7E] hover:brightness-95",
        )}
      >
        {submitted ? "Sent" : submitLabel || "Send"}
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-semibold text-slate-700">{children}</div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none",
        "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        props.className,
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none",
        "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        props.className,
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={classNames(
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none",
        "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        props.className,
      )}
    />
  );
}

function renderTextWithLinks(text: string) {
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;

  const parts = text.split(urlRegex);
  // split() with capturing groups includes the matches, so we rebuild carefully
  const out: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (!chunk) continue;

    if (urlRegex.test(chunk)) {
      const href = chunk.startsWith("http") ? chunk : `https://${chunk}`;
      out.push(
        <a
          key={`lnk_${i}_${href}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[#0b84ff] underline underline-offset-2"
        >
          {chunk}
        </a>,
      );
    } else {
      out.push(<React.Fragment key={`txt_${i}`}>{chunk}</React.Fragment>);
    }
  }

  return out;
}

export default function App() {
  const initial: PersistedState = {
    version: 1,
    chatMeta: { contactName: "Acme Support", statusLine: "online" },
    messages: [
      {
        id: uid("msg"),
        type: "text",
        from: "them",
        time: "09:12",
        text: "Hi! How can I help you today?",
      },
      {
        id: uid("msg"),
        type: "quick_reply",
        from: "them",
        time: "09:12",
        prompt: "Pick one:",
        options: ["Order", "Billing", "Other"],
      },
      {
        id: uid("msg"),
        type: "text",
        from: "me",
        time: "09:13",
        text: "I need an invoice PDF.",
      },
      {
        id: uid("msg"),
        type: "media_pdf",
        from: "them",
        time: "09:14",
        filename: "invoice_1042.pdf",
        sizeLabel: "312 KB",
      },
    ],
    selectedMessageId: null,
  };

  const [state, setState] = useLocalStorageState<PersistedState>(
    STORAGE_KEY,
    initial,
  );

  const safeState = useMemo(() => {
    try {
      return safeParsePersisted(state);
    } catch {
      return initial;
    }
  }, [state]);

  const [chatMeta, setChatMeta] = useState<ChatMeta>(safeState.chatMeta);
  const [messages, setMessages] = useState<Message[]>(safeState.messages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    safeState.selectedMessageId,
  );

  useEffect(() => {
    setState({
      version: 1,
      chatMeta,
      messages,
      selectedMessageId,
    });
  }, [chatMeta, messages, selectedMessageId, setState]);

  const selected = useMemo(
    () => messages.find((m) => m.id === selectedMessageId) || null,
    [messages, selectedMessageId],
  );

  useEffect(() => {
    if (!selectedMessageId && messages.length)
      setSelectedMessageId(messages[messages.length - 1].id);
  }, [messages, selectedMessageId]);

  const previewRef = useRef<HTMLDivElement | null>(null);

  function updateMessage(id: string, patch: Partial<Message>) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? ({ ...m, ...patch } as Message) : m)),
    );
  }

  function addMessage(type: MessageType) {
    const msg = createDefaultMessage(type);
    setMessages((prev) => [...prev, msg]);
    setSelectedMessageId(msg.id);
  }

  function deleteMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setSelectedMessageId((cur) => {
      if (cur !== id) return cur;
      const remaining = messages.filter((m) => m.id !== id);
      return remaining.length ? remaining[remaining.length - 1].id : null;
    });
  }

  function moveMessage(id: string, dir: "up" | "down") {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx < 0) return prev;
      const nextIdx = dir === "up" ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, removed);
      return copy;
    });
  }

  async function exportPng() {
    const node = previewRef.current;
    if (!node) return;
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const url = URL.createObjectURL(blob);
      downloadBlobUrl(url, `whatsapp-mockup-${Date.now()}.png`);
      URL.revokeObjectURL(url);
    } catch {
      alert(
        "Export failed. Ensure 'html-to-image' is installed and the preview is visible.",
      );
    }
  }

  function resetAll() {
    setChatMeta(initial.chatMeta);
    setMessages(initial.messages);
    setSelectedMessageId(null);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              WhatsApp Android Mockup Builder
            </div>
            <div className="text-sm text-slate-600">
              Text • Media (Image/PDF) • Audio • Flow • Quick Reply •
              MultiSelect
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportPng}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Export PNG
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr_360px]">
          {/* Left: Message list / add */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Messages
              </div>
              <div className="text-xs text-slate-500">
                {messages.length} total
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => addMessage("text")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                + Text
              </button>
              <button
                type="button"
                onClick={() => addMessage("media_image")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                + Image
              </button>
              <button
                type="button"
                onClick={() => addMessage("media_pdf")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                + PDF
              </button>
              <button
                type="button"
                onClick={() => addMessage("audio")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                + Audio
              </button>
              <button
                type="button"
                onClick={() => addMessage("flow")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                + Flow
              </button>
              <button
                type="button"
                onClick={() => addMessage("quick_reply")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                + Quick Reply
              </button>
              <button
                type="button"
                onClick={() => addMessage("multiselect")}
                className="col-span-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                + MultiSelect
              </button>
            </div>

            <div className="mt-3 max-h-[62vh] overflow-auto pr-1">
              {messages.length ? (
                <div className="space-y-2">
                  {messages.map((m, idx) => {
                    const active = m.id === selectedMessageId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMessageId(m.id)}
                        className={classNames(
                          "w-full rounded-2xl border px-3 py-2 text-left transition",
                          active
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 bg-white hover:bg-slate-50",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900">
                                {idx + 1}.
                              </span>
                              <span className="text-xs font-semibold text-slate-700">
                                {m.type}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {m.from === "me" ? "Me" : "Them"}
                              </span>
                            </div>
                            <div className="mt-0.5 truncate text-[12px] text-slate-600">
                              {m.type === "text"
                                ? m.text
                                : m.type === "media_image"
                                  ? m.caption || "Image"
                                  : m.type === "media_pdf"
                                    ? m.filename
                                    : m.type === "audio"
                                      ? `Audio • ${m.durationLabel}`
                                      : m.type === "flow"
                                        ? m.title
                                        : m.type === "quick_reply"
                                          ? m.prompt
                                          : m.type === "multiselect"
                                            ? m.prompt
                                            : ""}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveMessage(m.id, "up");
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] hover:bg-slate-50"
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveMessage(m.id, "down");
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] hover:bg-slate-50"
                                title="Move down"
                              >
                                ↓
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(m.id);
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] hover:bg-slate-50"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  Add a message type to begin.
                </div>
              )}
            </div>
          </div>

          {/* Middle: Preview (export target) */}
          <div className="flex justify-center">
            <div className="w-[360px]">
              <div
                ref={previewRef}
                className="overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
              >
                <Header chatMeta={chatMeta} />
                <div
                  className="relative h-[640px] overscroll-contain"
                  style={{
                    backgroundColor: "var(--wa-bg)",
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                  }}
                >
                  <div className="h-full overflow-y-auto px-3 py-3 pb-24">
                    <div className="mx-auto max-w-[390px] space-y-2 px-1">
                      {messages.map((m) => {
                        if (m.type === "quick_reply") {
                          const align = m.from === "me" ? "right" : "left";

                          return (
                            <BubbleWithActionsWidth
                              key={m.id}
                              align={align}
                              bubble={
                                <Bubble
                                  from={m.from}
                                  time={m.time}
                                  status={m.status}
                                >
                                  <span className="whitespace-pre-wrap break-words">
                                    {m.prompt}
                                  </span>
                                </Bubble>
                              }
                              actions={
                                <QuickReplyButtons
                                  options={m.options}
                                  selectedIndex={m.selectedIndex}
                                  onSelect={(idx) =>
                                    updateMessage(m.id, { selectedIndex: idx })
                                  }
                                />
                              }
                            />
                          );
                        }

                        return (
                          <Bubble
                            key={m.id}
                            from={m.from}
                            time={m.time}
                            status={m.status}
                          >
                            {m.type === "text" ? (
                              <span className="whitespace-pre-wrap break-words">
                                {renderTextWithLinks(m.text)}
                              </span>
                            ) : m.type === "media_image" ? (
                              <div className="space-y-2">
                                {m.caption ? (
                                  <div className="text-[13px]">{m.caption}</div>
                                ) : null}

                                {m.dataUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={m.dataUrl}
                                    alt="mock"
                                    className="max-h-[280px] w-full rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-[180px] w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                                    No image selected
                                  </div>
                                )}
                              </div>
                            ) : m.type === "media_pdf" ? (
                              <PdfRow
                                filename={m.filename}
                                sizeLabel={m.sizeLabel}
                              />
                            ) : m.type === "audio" ? (
                              <AudioRow
                                durationLabel={m.durationLabel}
                                dataUrl={m.dataUrl}
                              />
                            ) : m.type === "flow" ? (
                              <FlowCard
                                {...m}
                                onSubmit={() =>
                                  updateMessage(m.id, { submitted: true })
                                }
                                onSelectRadio={(fieldId, optionIndex) => {
                                  const nextFields = m.fields.map((f) =>
                                    f.id === fieldId
                                      ? { ...f, selectedIndex: optionIndex }
                                      : f,
                                  );
                                  updateMessage(m.id, { fields: nextFields });
                                }}
                              />
                            ) : m.type === "multiselect" ? (
                              <MultiSelectCard
                                {...m}
                                onToggle={(id) => {
                                  const cur = m.selectedOptionIds ?? [];
                                  const next = cur.includes(id)
                                    ? cur.filter((x) => x !== id)
                                    : [...cur, id];
                                  updateMessage(m.id, {
                                    selectedOptionIds: next,
                                  });
                                }}
                                onSubmit={() =>
                                  updateMessage(m.id, { submitted: true })
                                }
                              />
                            ) : null}
                          </Bubble>
                        );
                      })}
                    </div>
                  </div>

                  {/* Android bottom bar hint */}
                  <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 mx-auto max-w-[390px] px-3">
                    <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-[12px] text-slate-600 shadow-sm backdrop-blur">
                      <Smile size={16} />
                      <span className="flex-1">Message</span>
                      <Paperclip size={16} />
                      <Mic size={16} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-center text-xs text-slate-500">
                Export uses the preview area above.
              </div>
            </div>
          </div>

          {/* Right: Editors */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">
                Chat header
              </div>
              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <FieldLabel>Contact name</FieldLabel>
                  <Input
                    value={chatMeta.contactName}
                    onChange={(e) =>
                      setChatMeta((p) => ({
                        ...p,
                        contactName: e.target.value,
                      }))
                    }
                    placeholder="Contact"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel>Status line</FieldLabel>
                  <Input
                    value={chatMeta.statusLine}
                    onChange={(e) =>
                      setChatMeta((p) => ({ ...p, statusLine: e.target.value }))
                    }
                    placeholder="online / typing…"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  Message editor
                </div>
                {selected ? (
                  <div className="text-xs text-slate-500">
                    {selected.type} • {selected.id.slice(0, 8)}
                  </div>
                ) : null}
              </div>

              {!selected ? (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  Select a message to edit.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <FieldLabel>From</FieldLabel>
                      <Select
                        value={selected.from}
                        onChange={(e) =>
                          updateMessage(selected.id, {
                            from: e.target.value as Sender,
                          })
                        }
                      >
                        <option value="them">Them</option>
                        <option value="me">Me</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Time (HH:MM)</FieldLabel>
                      <Input
                        value={selected.time}
                        onChange={(e) =>
                          updateMessage(selected.id, {
                            time: clampTimeHHMM(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  {selected.type === "text" ? (
                    <div className="space-y-1">
                      <FieldLabel>Text</FieldLabel>
                      <Textarea
                        rows={6}
                        value={selected.text}
                        onChange={(e) =>
                          updateMessage(selected.id, { text: e.target.value })
                        }
                      />
                    </div>
                  ) : null}

                  {selected.type === "media_image" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <FieldLabel>Image file</FieldLabel>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const dataUrl = await fileToDataUrl(file);
                            updateMessage(selected.id, { dataUrl });
                          }}
                        />
                        <div className="text-[11px] text-slate-500">
                          Stored as a Data URL (persists in localStorage, but
                          large images can bloat storage).
                        </div>
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Caption</FieldLabel>
                        <Textarea
                          rows={3}
                          value={selected.caption}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              caption: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  {selected.type === "media_pdf" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <FieldLabel>Filename</FieldLabel>
                        <Input
                          value={selected.filename}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              filename: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Size label</FieldLabel>
                        <Input
                          value={selected.sizeLabel}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              sizeLabel: e.target.value,
                            })
                          }
                          placeholder="312 KB"
                        />
                      </div>
                    </div>
                  ) : null}

                  {selected.type === "audio" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <FieldLabel>Audio file</FieldLabel>
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const dataUrl = await fileToDataUrl(file);
                            updateMessage(selected.id, { dataUrl });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Duration label</FieldLabel>
                        <Input
                          value={selected.durationLabel}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              durationLabel: e.target.value,
                            })
                          }
                          placeholder="0:12"
                        />
                      </div>
                    </div>
                  ) : null}

                  {selected.type === "flow" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <FieldLabel>Title</FieldLabel>
                        <Input
                          value={selected.title}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Body</FieldLabel>
                        <Textarea
                          rows={3}
                          value={selected.body}
                          onChange={(e) =>
                            updateMessage(selected.id, { body: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-800">
                            Fields
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextFields = [
                                ...selected.fields,
                                {
                                  id: uid("fld"),
                                  label: "New field",
                                  required: false,
                                  fieldType: "text" as FlowFieldType,
                                  placeholder: "",
                                  options: [],
                                },
                              ];
                              updateMessage(selected.id, {
                                fields: nextFields,
                              });
                            }}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white hover:bg-slate-800"
                          >
                            + Field
                          </button>
                        </div>

                        <div className="space-y-3">
                          {selected.fields.map((f, idx) => (
                            <div
                              key={f.id}
                              className="rounded-2xl bg-slate-50 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="text-xs font-semibold text-slate-800">
                                  Field {idx + 1}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextFields = selected.fields.filter(
                                      (x) => x.id !== f.id,
                                    );
                                    updateMessage(selected.id, {
                                      fields: nextFields,
                                    });
                                  }}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <FieldLabel>Label</FieldLabel>
                                  <Input
                                    value={f.label}
                                    onChange={(e) => {
                                      const next = selected.fields.map((x) =>
                                        x.id === f.id
                                          ? { ...x, label: e.target.value }
                                          : x,
                                      );
                                      updateMessage(selected.id, {
                                        fields: next,
                                      });
                                    }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <FieldLabel>Type</FieldLabel>
                                  <Select
                                    value={f.fieldType}
                                    onChange={(e) => {
                                      const next = selected.fields.map((x) =>
                                        x.id === f.id
                                          ? {
                                              ...x,
                                              fieldType: e.target
                                                .value as FlowFieldType,
                                            }
                                          : x,
                                      );
                                      updateMessage(selected.id, {
                                        fields: next,
                                      });
                                    }}
                                  >
                                    <option value="text">text</option>
                                    <option value="email">email</option>
                                    <option value="phone">phone</option>
                                    <option value="number">number</option>
                                    <option value="date">date</option>
                                    <option value="radio">radio</option>
                                  </Select>
                                </div>
                              </div>

                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <FieldLabel>Placeholder</FieldLabel>
                                  <Input
                                    value={f.placeholder}
                                    onChange={(e) => {
                                      const next = selected.fields.map((x) =>
                                        x.id === f.id
                                          ? {
                                              ...x,
                                              placeholder: e.target.value,
                                            }
                                          : x,
                                      );
                                      updateMessage(selected.id, {
                                        fields: next,
                                      });
                                    }}
                                  />
                                  {f.fieldType === "radio" ? (
                                    <div className="mt-2 space-y-1">
                                      <FieldLabel>
                                        Radio options (one per line)
                                      </FieldLabel>
                                      <Textarea
                                        rows={4}
                                        value={(f.options ?? []).join("\n")}
                                        onChange={(e) => {
                                          const lines = e.target.value
                                            .split("\n")
                                            .map((s) => s.trim())
                                            .filter(Boolean);

                                          const next = selected.fields.map(
                                            (x) =>
                                              x.id === f.id
                                                ? {
                                                    ...x,
                                                    options: lines,
                                                    // keep selection valid if options shrink
                                                    selectedIndex:
                                                      x.selectedIndex != null &&
                                                      x.selectedIndex >=
                                                        lines.length
                                                        ? null
                                                        : (x.selectedIndex ??
                                                          null),
                                                  }
                                                : x,
                                          );

                                          updateMessage(selected.id, {
                                            fields: next,
                                          });
                                        }}
                                        placeholder={
                                          "Option A\nOption B\nOption C"
                                        }
                                      />
                                    </div>
                                  ) : null}
                                </div>

                                <div className="space-y-1">
                                  <FieldLabel>Required</FieldLabel>
                                  <div className="flex h-[38px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-3">
                                    <input
                                      type="checkbox"
                                      checked={f.required}
                                      onChange={(e) => {
                                        const next = selected.fields.map((x) =>
                                          x.id === f.id
                                            ? {
                                                ...x,
                                                required: e.target.checked,
                                              }
                                            : x,
                                        );
                                        updateMessage(selected.id, {
                                          fields: next,
                                        });
                                      }}
                                    />
                                    <span className="text-[13px] text-slate-700">
                                      Yes
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <FieldLabel>Submit label</FieldLabel>
                        <Input
                          value={selected.submitLabel}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              submitLabel: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  {selected.type === "quick_reply" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <FieldLabel>Prompt</FieldLabel>
                        <Textarea
                          rows={3}
                          value={selected.prompt}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              prompt: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-800">
                            Options
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateMessage(selected.id, {
                                options: [...selected.options, "New option"],
                              })
                            }
                            className="rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white hover:bg-slate-800"
                          >
                            + Option
                          </button>
                        </div>

                        <div className="mt-2 space-y-2">
                          {selected.options.map((o, idx) => (
                            <div
                              key={`${idx}`}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={o}
                                onChange={(e) => {
                                  const next = selected.options.map((x, i) =>
                                    i === idx ? e.target.value : x,
                                  );
                                  updateMessage(selected.id, { options: next });
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = selected.options.filter(
                                    (_, i) => i !== idx,
                                  );
                                  updateMessage(selected.id, { options: next });
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {!selected.options.length ? (
                            <div className="text-[12px] text-slate-500">
                              No options
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {selected.type === "multiselect" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <FieldLabel>Prompt</FieldLabel>
                        <Textarea
                          rows={3}
                          value={selected.prompt}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              prompt: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-800">
                            Options
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateMessage(selected.id, {
                                options: [
                                  ...selected.options,
                                  { id: uid("opt"), label: "New option" },
                                ],
                              })
                            }
                            className="rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white hover:bg-slate-800"
                          >
                            + Option
                          </button>
                        </div>

                        <div className="mt-2 space-y-2">
                          {selected.options.map((o) => (
                            <div key={o.id} className="flex items-center gap-2">
                              <Input
                                value={o.label}
                                onChange={(e) => {
                                  const next = selected.options.map((x) =>
                                    x.id === o.id
                                      ? { ...x, label: e.target.value }
                                      : x,
                                  );
                                  updateMessage(selected.id, { options: next });
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = selected.options.filter(
                                    (x) => x.id !== o.id,
                                  );
                                  updateMessage(selected.id, { options: next });
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {!selected.options.length ? (
                            <div className="text-[12px] text-slate-500">
                              No options
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <FieldLabel>Submit label</FieldLabel>
                        <Input
                          value={selected.submitLabel}
                          onChange={(e) =>
                            updateMessage(selected.id, {
                              submitLabel: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => deleteMessage(selected.id)}
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete this message
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[12px] text-slate-600 shadow-sm">
              <div className="font-semibold text-slate-800">Notes</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Images/audio are stored as Data URLs for persistence (can hit
                  localStorage limits).
                </li>
                <li>
                  Export is a best-effort DOM snapshot; keep the preview fully
                  visible for best results.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Tip: To simulate inbound/outbound threads, toggle “From” per message
          and reorder as needed.
        </div>
      </div>
    </div>
  );
}
