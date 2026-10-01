export type OrderRecord = {
  id: string;
  fields: {
    OrderId?: number;
    Status?: "Ordered" | "Selecting" | "Building" | "Built" | "Delivered";
    WhatsAppAddress?: string;
    Genero?: string;
    Cuerpo?: string;
    Tono?: string;
    Cabello?: string;
    Cara?: string;
    Mano?: string;
    Mano2?: string;
    ToqueFinal?: string;
    NombreCaja?: string;
    CreatedAt?: string;
    UpdatedAt?: string;
    SeleccionSentAt?: string;
    EnsambleSentAt?: string;
    ListoSentAt?: string;
    EntregadoSentAt?: string;
    LastError?: string;
  };
};

const BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL as string;

if (!BASE) {
  throw new Error("VITE_FUNCTIONS_BASE_URL is not set");
}

const SECRET_KEY = "funko_ops_secret";

export function getSecret(): string | null {
  return sessionStorage.getItem(SECRET_KEY);
}

export function setSecret(secret: string): void {
  sessionStorage.setItem(SECRET_KEY, secret);
}

export function clearSecret(): void {
  sessionStorage.removeItem(SECRET_KEY);
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const secret = getSecret();
  if (!secret) throw new UnauthorizedError();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Funko-Secret": secret,
      ...(init.headers || {}),
    },
  });
  if (res.status === 401) {
    clearSecret();
    throw new UnauthorizedError();
  }
  const body = (await res.json()) as T & { ok?: boolean; error?: string };
  if (!res.ok || body.ok === false) {
    throw new Error(body.error || `${path} failed with ${res.status}`);
  }
  return body;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function listOrders(): Promise<OrderRecord[]> {
  const body = await call<{ records: OrderRecord[] }>("/list_orders");
  return body.records;
}

export type TargetState = "Selecting" | "Building" | "Built" | "Delivered";

export type AdvanceResult = {
  ok: true;
  priorState: string;
  newState: string;
  messageSid: string | null;
  skipped?: boolean;
};

export async function advanceState(recordId: string, targetState: TargetState): Promise<AdvanceResult> {
  return call<AdvanceResult>("/advance_state", {
    method: "POST",
    body: JSON.stringify({ recordId, targetState }),
  });
}

export async function verifySecret(secret: string): Promise<boolean> {
  const res = await fetch(`${BASE}/list_orders?limit=1`, {
    headers: { "X-Funko-Secret": secret },
  });
  return res.status !== 401;
}
