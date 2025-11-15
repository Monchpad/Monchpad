const LEDGER_KEY = "monad-demo-ledger";

export interface DemoLedgerEntry {
  address: string;
  rawDeposited: string;
  lastUpdated: number;
}

function readLedger(): DemoLedgerEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LEDGER_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DemoLedgerEntry[];
  } catch {
    return [];
  }
}

function writeLedger(entries: DemoLedgerEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("monad-ledger-updated"));
}

export function getLedgerEntries() {
  return readLedger();
}

export function recordDemoDeposit(address: string, rawAmount: bigint) {
  if (typeof window === "undefined") return;
  const entries = readLedger();
  const idx = entries.findIndex((entry) => entry.address.toLowerCase() === address.toLowerCase());
  const amount = BigInt(rawAmount);
  if (idx >= 0) {
    const current = entries[idx];
    entries[idx] = {
      ...current,
      rawDeposited: (BigInt(current.rawDeposited) + amount).toString(),
      lastUpdated: Date.now()
    };
  } else {
    entries.push({
      address,
      rawDeposited: amount.toString(),
      lastUpdated: Date.now()
    });
  }
  writeLedger(entries);
}

