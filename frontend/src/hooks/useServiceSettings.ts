import { useCallback, useEffect, useState } from "react";
import type { ServiceSettings } from "../types";

const STORAGE_KEY = "monad-service-settings";

const DEFAULT_SETTINGS: ServiceSettings = {
  minDeposit: "100",
  maxDeposit: "50000",
  depositPeriodDays: "7",
  allocationToken: "Monad",
  description: "버퍼형 USDC 예치 후 Monad 토큰으로 분배",
  supportedProducts: "megaETH, Stable"
};

export function useServiceSettings() {
  const [settings, setSettings] = useState<ServiceSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      } catch (error) {
        console.warn("Failed to parse service settings", error);
      }
    }
    setLoaded(true);
  }, []);

  const updateSettings = useCallback(
    (next: ServiceSettings) => {
      setSettings(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    },
    [setSettings]
  );

  return { settings, updateSettings, loaded };
}

