import type { StageVaultContext } from "../types";

export function SettlementCard({ vault }: { vault: StageVaultContext }) {
  const handleRefund = async () => {
    if (!vault.account) return;
    await vault.refundExcess(vault.account);
  };

  return (
    <div className="card">
      <div className="pill">post-window</div>
      <h2>Return excess to depositor</h2>
      <p className="muted">
        예치 기간이 끝나면 실제 할당량보다 초과한 USDC가 예치했던 동일한 이더리움 주소로 자동 반환됩니다. 수령 주소를 따로
        지정할 필요가 없습니다.
      </p>
      <div className="stack">
        <label>예치 주소</label>
        <input type="text" value={vault.account ?? ""} readOnly placeholder="지갑 연결 필요" />
        <button className="secondary" type="button" disabled={!vault.account || vault.loadingAction === "refund"} onClick={handleRefund}>
          {vault.loadingAction === "refund" ? "Refunding..." : "Refund to this address"}
        </button>
      </div>
    </div>
  );
}

