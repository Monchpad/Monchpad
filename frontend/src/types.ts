import type { BrowserProvider, Contract, JsonRpcSigner } from "ethers";

export interface StageVaultContext {
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
  account?: string;
  contract?: Contract;
  usdcBalance?: string;
  isAllocator: boolean;
  connect: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshUsdcBalance: () => Promise<void>;
  deposit: (amount: string) => Promise<void>;
  claimAllocation: (recipient: string) => Promise<void>;
  refundExcess: (recipient: string) => Promise<void>;
  settleParticipant: (recipient: string, allocationAmount?: string) => Promise<void>;
  recordAllocations: (payload: AllocationPayload[]) => Promise<void>;
  loadingAction?: string;
  info?: DepositInfo;
}

export interface AllocationPayload {
  address: string;
  allocation: string;
}

export interface DepositInfo {
  deposited: string;
  allocation: string;
  claimedAllocation: string;
  excessRefunded: boolean;
}

export interface ServiceSettings {
  minDeposit: string;
  maxDeposit: string;
  depositPeriodDays: string;
  allocationToken: string;
  description: string;
  supportedProducts: string;
}

export interface DemoParticipant {
  address: string;
  rawDeposited: string;
  deposited: string;
  lastUpdated: number;
}

