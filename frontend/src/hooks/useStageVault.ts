import { BrowserProvider, Contract, JsonRpcSigner, formatUnits, parseUnits } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import Web3 from "web3";
import { NETWORK, VAULT_CONFIG } from "../config";
import { STAGE_VAULT_ABI } from "../services/stageVaultAbi";
import { ERC20_ABI } from "../services/erc20Abi";
import { getLedgerEntries, recordDemoDeposit } from "../services/demoLedger";
import type { AllocationPayload, DepositInfo, StageVaultContext } from "../types";

const USDC_DECIMALS = 6;
const AUTO_CONNECT_KEY = "monad-auto-connect";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const HAS_REAL_CONTRACT = VAULT_CONFIG.contractAddress && VAULT_CONFIG.contractAddress !== ZERO_ADDRESS;

export function useStageVault(): StageVaultContext {
  const [provider, setProvider] = useState<BrowserProvider>();
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const [account, setAccount] = useState<string>();
  const [contract, setContract] = useState<Contract>();
  const [tokenContract, setTokenContract] = useState<Contract>();
  const [info, setInfo] = useState<DepositInfo>();
  const [allocator, setAllocator] = useState<string>();
  const [loadingAction, setLoadingAction] = useState<string>();
  const [usdcBalance, setUsdcBalance] = useState<string>();

  const isAllocator = useMemo(() => {
    if (!allocator || !account) return false;
    return allocator.toLowerCase() === account.toLowerCase();
  }, [allocator, account]);

  const establishConnection = useCallback(
    async (requestAccounts: boolean) => {
    if (!window.ethereum) throw new Error("MetaMask not detected");
    const browserProvider = new BrowserProvider(window.ethereum);
      if (requestAccounts) {
    await browserProvider.send("eth_requestAccounts", []);
      } else {
        const accounts = await browserProvider.send("eth_accounts", []);
        if (!accounts.length) throw new Error("No authorized accounts");
      }
    const nextSigner = await browserProvider.getSigner();
      const address = await nextSigner.getAddress();
    setProvider(browserProvider);
    setSigner(nextSigner);
      setAccount(address);
      if (HAS_REAL_CONTRACT) {
        setContract(new Contract(VAULT_CONFIG.contractAddress, STAGE_VAULT_ABI, nextSigner));
      } else {
        setContract(undefined);
      }
      if (VAULT_CONFIG.usdcAddress && VAULT_CONFIG.usdcAddress !== ZERO_ADDRESS) {
        setTokenContract(new Contract(VAULT_CONFIG.usdcAddress, ERC20_ABI, nextSigner));
      } else {
        setTokenContract(undefined);
      }
      return address;
    },
    []
  );

  const connect = useCallback(async () => {
    const address = await establishConnection(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_CONNECT_KEY, address);
    }
  }, [establishConnection]);

  const fetchUsdcBalance = useCallback(
    async (target?: string) => {
      if (!target || !NETWORK.rpcUrl || !VAULT_CONFIG.usdcAddress) return;
      try {
        const web3 = new Web3(NETWORK.rpcUrl);
        const token = new web3.eth.Contract(ERC20_ABI as any, VAULT_CONFIG.usdcAddress);
        const rawBalance = await token.methods.balanceOf(target).call();
        setUsdcBalance(formatUnits(rawBalance, USDC_DECIMALS));
      } catch (error) {
        console.error("Failed to fetch USDC balance", error);
        setUsdcBalance(undefined);
      }
    },
    []
  );

  const refreshUsdcBalance = useCallback(async () => {
    if (!account) return;
    await fetchUsdcBalance(account);
  }, [account, fetchUsdcBalance]);

  const syncDemoInfo = useCallback(
    (user?: string) => {
      if (contract) return;
      const target = user ?? account;
      if (!target) return;
      const entries = getLedgerEntries();
      const entry = entries.find((item) => item.address.toLowerCase() === target.toLowerCase());
      if (!entry) {
        setInfo(undefined);
        return;
      }
      const deposited = formatUnits(BigInt(entry.rawDeposited || "0"), USDC_DECIMALS);
      setInfo({
        deposited,
        allocation: "0",
        claimedAllocation: "0",
        excessRefunded: false
      });
    },
    [account, contract]
  );

  const refresh = useCallback(async () => {
    if (signer && contract) {
    const user = await signer.getAddress();
    const raw = await contract.getDepositInfo(user);
    const allocatorAddress = await contract.allocator();
    setAllocator(allocatorAddress);
    setInfo({
      deposited: formatUnits(raw.deposited, USDC_DECIMALS),
      allocation: formatUnits(raw.allocation, USDC_DECIMALS),
      claimedAllocation: formatUnits(raw.claimedAllocation, USDC_DECIMALS),
      excessRefunded: raw.excessRefunded
    });
      await fetchUsdcBalance(user);
    } else {
      syncDemoInfo();
    }
  }, [contract, signer, fetchUsdcBalance, syncDemoInfo]);

  const withAction = useCallback(
    async (label: string, fn: () => Promise<void>) => {
      try {
        setLoadingAction(label);
        await fn();
        await refresh();
      } finally {
        setLoadingAction(undefined);
      }
    },
    [refresh]
  );

  const deposit = useCallback(
    async (amount: string) => {
      const parsed = parseUnits(amount, USDC_DECIMALS);
      await withAction("deposit", async () => {
        if (contract) {
          if (!tokenContract || !account) throw new Error("Token contract not ready");
          const allowance = await tokenContract.allowance(account, VAULT_CONFIG.contractAddress);
          if (allowance < parsed) {
            const approveTx = await tokenContract.approve(VAULT_CONFIG.contractAddress, parsed);
            await approveTx.wait();
          }
        const tx = await contract.deposit(parsed);
        await tx.wait();
          const user = await contract.signer.getAddress();
          recordDemoDeposit(user, parsed);
        } else {
          if (!account) throw new Error("지갑을 먼저 연결하세요.");
          recordDemoDeposit(account, parsed);
          syncDemoInfo(account);
        }
      });
    },
    [contract, withAction, account, syncDemoInfo, tokenContract]
  );

  const claimAllocation = useCallback(
    async (recipient: string) => {
      if (!contract) throw new Error("Contract not ready");
      await withAction("claim", async () => {
        const tx = await contract.claimAllocation(recipient);
        await tx.wait();
      });
    },
    [contract, withAction]
  );

  const refundExcess = useCallback(
    async (recipient: string) => {
      if (!contract) throw new Error("Contract not ready");
      await withAction("refund", async () => {
        const tx = await contract.refundExcess(recipient);
        await tx.wait();
      });
    },
    [contract, withAction]
  );

  const settleParticipant = useCallback(
    async (recipient: string, allocationAmount?: string) => {
      if (!contract) throw new Error("Contract not ready");
      await withAction("settle", async () => {
        if (allocationAmount) {
          const allocationUnits = parseUnits(allocationAmount, USDC_DECIMALS);
          const allocateTx = await contract.recordAllocations([recipient], [allocationUnits]);
          await allocateTx.wait();
        }
        const claimTx = await contract.claimAllocation(recipient);
        await claimTx.wait();
        const refundTx = await contract.refundExcess(recipient);
        await refundTx.wait();
      });
    },
    [contract, withAction]
  );

  const recordAllocations = useCallback(
    async (payload: AllocationPayload[]) => {
      if (!contract) throw new Error("Contract not ready");
      if (!payload.length) throw new Error("No payload");
      await withAction("allocate", async () => {
        const users = payload.map((item) => item.address);
        const amounts = payload.map((item) => parseUnits(item.allocation, USDC_DECIMALS));
        const tx = await contract.recordAllocations(users, amounts);
        await tx.wait();
      });
    },
    [contract, withAction]
  );

  useEffect(() => {
    if (!provider || !window.ethereum) return;
    const handler = (accounts: string[]) => {
      if (!accounts.length) {
        setAccount(undefined);
        setSigner(undefined);
        setProvider(undefined);
        setContract(undefined);
        setTokenContract(undefined);
        window.localStorage.removeItem(AUTO_CONNECT_KEY);
        return;
      }
      setAccount(accounts[0]);
      refresh();
    };
    window.ethereum.on("accountsChanged", handler);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handler);
    };
  }, [provider, refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(AUTO_CONNECT_KEY);
    if (!stored) return;
    establishConnection(false).catch(() => {
      window.localStorage.removeItem(AUTO_CONNECT_KEY);
    });
  }, [establishConnection]);

  useEffect(() => {
    if (provider && signer && contract) {
      void refresh();
    }
  }, [provider, signer, contract, refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => syncDemoInfo();
    window.addEventListener("monad-ledger-updated", handler);
    return () => window.removeEventListener("monad-ledger-updated", handler);
  }, [syncDemoInfo]);

  useEffect(() => {
    void refreshUsdcBalance();
  }, [refreshUsdcBalance]);

  return {
    provider,
    signer,
    account,
    contract,
    info,
    usdcBalance,
    isAllocator,
    connect,
    refresh,
    refreshUsdcBalance,
    deposit,
    claimAllocation,
    refundExcess,
    settleParticipant,
    recordAllocations,
    loadingAction
  };
}

