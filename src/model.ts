export type Sender = "me" | "them";
export type DeliveryStatus = "sent" | "delivered" | "read";

export type MessageType =
  | "text"
  | "media_image"
  | "media_video"
  | "media_pdf"
  | "audio"
  | "link"
  | "quick_reply"
  | "list"
  | "cta"
  | "carousel"
  | "flow"
  | "multiselect";

export type MessageBase = {
  id: string;
  type: MessageType;
  from: Sender;
  time: string;
  status?: DeliveryStatus;
};

export type ListItem = { id: string; emoji: string; title: string; description: string };
export type CtaButton = { id: string; kind: "url" | "phone"; label: string; value: string };
export type CarouselCard = {
  id: string;
  imageUrl: string;
  title: string;
  body: string;
  ctaLabel: string;
  productUrl: string;
};

export type FlowField = {
  id: string;
  label: string;
  required: boolean;
  fieldType: "text" | "email" | "phone" | "number" | "date" | "radio";
  placeholder: string;
  options?: string[];
  selectedIndex?: number | null;
};

export type Message =
  | (MessageBase & { type: "text"; text: string })
  | (MessageBase & { type: "media_image"; dataUrl: string; caption: string })
  | (MessageBase & { type: "media_video"; dataUrl: string; caption: string })
  | (MessageBase & { type: "media_pdf"; filename: string; sizeLabel: string })
  | (MessageBase & { type: "audio"; dataUrl: string; durationLabel: string })
  | (MessageBase & { type: "link"; url: string; title: string; description: string; thumbnailUrl: string })
  | (MessageBase & { type: "quick_reply"; prompt: string; options: string[]; selectedIndex?: number | null })
  | (MessageBase & { type: "list"; prompt: string; sectionTitle: string; buttonLabel: string; items: ListItem[] })
  | (MessageBase & { type: "cta"; text: string; buttons: CtaButton[] })
  | (MessageBase & { type: "carousel"; intro: string; cards: CarouselCard[] })
  | (MessageBase & { type: "flow"; title: string; body: string; fields: FlowField[]; submitLabel: string; submitted?: boolean })
  | (MessageBase & { type: "multiselect"; prompt: string; options: { id: string; label: string }[]; submitLabel: string; selectedOptionIds?: string[]; submitted?: boolean });

export type ChatMeta = { contactName: string; statusLine: string };
export type PersistedState = {
  version: 2;
  chatMeta: ChatMeta;
  messages: Message[];
  selectedMessageId: string | null;
};

export const STORAGE_KEY = "wa-mockup-builder:v2";
const LEGACY_STORAGE_KEY = "wa-mockup-builder:v1";

export const messageTypeLabels: Record<MessageType, { emoji: string; label: string }> = {
  text: { emoji: "💬", label: "Text" },
  media_image: { emoji: "🖼️", label: "Image" },
  media_video: { emoji: "🎬", label: "Video" },
  media_pdf: { emoji: "📄", label: "PDF" },
  audio: { emoji: "🎤", label: "Audio" },
  link: { emoji: "🔗", label: "Link" },
  quick_reply: { emoji: "⚡", label: "Quick reply" },
  list: { emoji: "☰", label: "List" },
  cta: { emoji: "↗️", label: "CTA" },
  carousel: { emoji: "🛍️", label: "Carousel" },
  flow: { emoji: "🧾", label: "Flow" },
  multiselect: { emoji: "☑️", label: "Multi-select" },
};

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function nowHHMM() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function normalizeTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return "12:00";
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function createDefaultMessage(type: MessageType): Message {
  const base = { id: uid("msg"), from: "them" as const, time: nowHHMM(), status: "read" as const };
  switch (type) {
    case "text": return { ...base, type, text: "Hello! 👋 How can I help you today?" };
    case "media_image": return { ...base, type, dataUrl: "", caption: "A beautiful image ✨" };
    case "media_video": return { ...base, type, dataUrl: "", caption: "Watch this short video 🎬" };
    case "media_pdf": return { ...base, type, filename: "document.pdf", sizeLabel: "250 KB" };
    case "audio": return { ...base, type, dataUrl: "", durationLabel: "0:12" };
    case "link": return { ...base, type, url: "https://example.com", title: "Visit our website", description: "Discover more details on our site.", thumbnailUrl: "" };
    case "quick_reply": return { ...base, type, prompt: "Choose an option:", options: ["👍 Yes", "👎 No", "🤔 Maybe"], selectedIndex: null };
    case "list": return {
      ...base, type, prompt: "Here are our product categories 😊", sectionTitle: "Categories", buttonLabel: "View all",
      items: [
        { id: uid("item"), emoji: "📱", title: "Electronics", description: "Smartphones & laptops" },
        { id: uid("item"), emoji: "👕", title: "Fashion", description: "Clothing & accessories" },
        { id: uid("item"), emoji: "🏡", title: "Home & Garden", description: "Decor & utilities" },
      ],
    };
    case "cta": return {
      ...base, type, text: "Would you like to know more? 🚀",
      buttons: [
        { id: uid("cta"), kind: "url", label: "Visit website", value: "https://example.com" },
        { id: uid("cta"), kind: "phone", label: "Call us", value: "+34 600 000 000" },
      ],
    };
    case "carousel": return {
      ...base, type, intro: "Choose a featured product 🛍️", cards: [
        { id: uid("card"), imageUrl: "", title: "Featured product", body: "A short product description.", ctaLabel: "View product", productUrl: "https://example.com/product" },
      ],
    };
    case "flow": return {
      ...base, type, title: "Contact form", body: "Tell us how we can reach you.", submitLabel: "Submit", submitted: false,
      fields: [
        { id: uid("field"), label: "Full name", required: true, fieldType: "text", placeholder: "Type here" },
        { id: uid("field"), label: "Contact preference", required: false, fieldType: "radio", placeholder: "", options: ["WhatsApp", "Email", "Phone"], selectedIndex: null },
      ],
    };
    case "multiselect": return {
      ...base, type, prompt: "Select all that apply:", submitLabel: "Send selection", selectedOptionIds: [], submitted: false,
      options: ["Option A", "Option B", "Option C"].map((label) => ({ id: uid("option"), label })),
    };
  }
}

export function defaultState(): PersistedState {
  const messages: Message[] = [
    { ...createDefaultMessage("text"), id: uid("msg"), time: "10:24", type: "text", text: "Hi there! 👋 Welcome to the WhatsApp mockup builder." },
    { ...createDefaultMessage("quick_reply"), id: uid("msg"), time: "10:25" },
    { ...createDefaultMessage("list"), id: uid("msg"), time: "10:26" },
    { ...createDefaultMessage("cta"), id: uid("msg"), time: "10:27" },
    { ...createDefaultMessage("carousel"), id: uid("msg"), time: "10:28" },
  ];
  return { version: 2, chatMeta: { contactName: "Demo Store", statusLine: "online" }, messages, selectedMessageId: messages[0]?.id ?? null };
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Message>;
  return typeof candidate.id === "string" && typeof candidate.type === "string" && candidate.type in messageTypeLabels && (candidate.from === "me" || candidate.from === "them") && typeof candidate.time === "string";
}

export function parseState(value: unknown): PersistedState {
  const fallback = defaultState();
  const source = Array.isArray(value) ? { messages: value } : value;
  if (!source || typeof source !== "object") throw new Error("JSON must be a conversation object or an array of messages.");
  const raw = source as { chatMeta?: unknown; messages?: unknown; selectedMessageId?: unknown };
  if (!Array.isArray(raw.messages) || !raw.messages.every(isMessage)) throw new Error("Every message needs a valid id, type, from, and time.");
  const meta = raw.chatMeta && typeof raw.chatMeta === "object" ? raw.chatMeta as Partial<ChatMeta> : {};
  const messages = raw.messages as Message[];
  return {
    version: 2,
    chatMeta: {
      contactName: typeof meta.contactName === "string" ? meta.contactName : fallback.chatMeta.contactName,
      statusLine: typeof meta.statusLine === "string" ? meta.statusLine : fallback.chatMeta.statusLine,
    },
    messages,
    selectedMessageId: typeof raw.selectedMessageId === "string" && messages.some((message) => message.id === raw.selectedMessageId)
      ? raw.selectedMessageId
      : messages[0]?.id ?? null,
  };
}

export function loadState(): PersistedState {
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return parseState(JSON.parse(raw));
    } catch { /* Ignore corrupt or incompatible local data. */ }
  }
  return defaultState();
}


