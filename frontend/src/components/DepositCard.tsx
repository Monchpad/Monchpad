import { FormEvent, useState } from "react";
import type { ServiceSettings, StageVaultContext } from "../types";

interface Props {
  vault: StageVaultContext;
  settings: ServiceSettings;
}

export function DepositCard({ vault, settings }: Props) {
  const [amount, setAmount] = useState("");

  const handleDeposit = async (event: FormEvent) => {
    event.preventDefault();
    if (!amount) return;
    await vault.deposit(amount);
    setAmount("");
  };

  const handleUseBalance = () => {
    if (!vault.usdcBalance) return;
    setAmount(vault.usdcBalance);
  };

  return (
    <div className="card">
      <div className="pill">participant</div>
      <h2>Buffered USDC Deposit</h2>
      <p className="muted">
        이더리움에서 USDC를 예치하면 Monad 네트워크가 트래픽을 분산 처리하고, 예치한 이더리움 주소로 최종 Monad 토큰을
        배분합니다. 초과분 역시 동일한 주소로 돌려받습니다.
      </p>

      <form onSubmit={handleDeposit}>
        <label>Deposit amount (USDC)</label>
        <div className="balance-row">
          <span className="muted">보유 잔액: {vault.usdcBalance ? `${vault.usdcBalance} USDC` : "-"}</span>
          <button className="link-button" type="button" onClick={handleUseBalance} disabled={!vault.usdcBalance}>
            최대 입력
          </button>
        </div>
        <input
          type="number"
          step="0.000001"
          min="0"
          placeholder={vault.usdcBalance ?? "1500"}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <button className="primary" type="submit" disabled={!vault.account || !amount || vault.loadingAction === "deposit"}>
          {vault.loadingAction === "deposit" ? "Depositing..." : "Deposit"}
        </button>
      </form>

      <div className="stack">
        <label>배분 대상</label>
        <p className="muted">
          관리자가 관리자 페이지에서 claim 버튼을 누르면 예치 주소 ({vault.account ?? "지갑 연결 필요"})로 Monad 토큰이 자동 배분되고,
          초과 예치분은 같은 주소로 환불됩니다.
        </p>
      </div>

      <div className="status-grid">
        <div>
          <h3>Status</h3>
          <p>Deposited: {vault.info?.deposited ?? "0"} USDC</p>
          <p>Allocated: {vault.info?.allocation ?? "0"} {settings.allocationToken}</p>
          <p>Claimed: {vault.info?.claimedAllocation ?? "0"} {settings.allocationToken}</p>
        </div>
        <div>
          <h3>서비스 조건</h3>
          <p>최소 예치: {settings.minDeposit} USDC</p>
          <p>최대 예치: {settings.maxDeposit} USDC</p>
          <p>예치 기간: {settings.depositPeriodDays}일</p>
        </div>
      </div>
    </div>
  );
}

