import { formatUnits } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLedgerEntries } from "../services/demoLedger";
import type { DemoParticipant } from "../types";

const USDC_DECIMALS = 6;

export function useDemoLedger() {
  const [participants, setParticipants] = useState<DemoParticipant[]>([]);

  const load = useCallback(() => {
    const entries = getLedgerEntries();
    const mapped: DemoParticipant[] = entries.map((entry) => ({
      address: entry.address,
      rawDeposited: entry.rawDeposited,
      deposited: formatUnits(BigInt(entry.rawDeposited || "0"), USDC_DECIMALS),
      lastUpdated: entry.lastUpdated
    }));
    setParticipants(mapped);
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("monad-ledger-updated", handler);
    return () => window.removeEventListener("monad-ledger-updated", handler);
  }, [load]);

  const totalDeposited = useMemo(() => {
    const total = participants.reduce((acc, entry) => acc + BigInt(entry.rawDeposited || "0"), 0n);
    return formatUnits(total, USDC_DECIMALS);
  }, [participants]);

  return { participants, totalDeposited, refreshLedger: load };
}

