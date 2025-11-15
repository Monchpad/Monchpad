import { FormEvent, useMemo, useState } from "react";
import { formatUnits } from "ethers";
import type { ServiceSettings, StageVaultContext } from "../types";
import { AdminPanel } from "../components/AdminPanel";
import { useDemoLedger } from "../hooks/useDemoLedger";

interface Props {
  vault: StageVaultContext;
  settings: ServiceSettings;
  onSave: (settings: ServiceSettings) => void;
}

export function AdminSettingsPage({ vault, settings, onSave }: Props) {
  const [draft, setDraft] = useState<ServiceSettings>(settings);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const { participants, totalDeposited } = useDemoLedger();
  const [settleStatus, setSettleStatus] = useState<"idle" | "processing">("idle");

  const disableForm = status === "saving";

  const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings]);

  const handleChange = (key: keyof ServiceSettings, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!hasChanges) return;
    setStatus("saving");
    onSave(draft);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2500);
  };

  const handleSettleAll = async () => {
    if (!participants.length) {
      alert("예치된 참가자가 없습니다.");
      return;
    }
    setSettleStatus("processing");
    try {
      for (const participant of participants) {
        await vault.settleParticipant(participant.address);
      }
    } finally {
      setSettleStatus("idle");
    }
  };

  return (
    <>
      <section className="card large-card">
        <div className="pill">admin</div>
        <h2>서비스 조건 설정</h2>
        <p className="muted">megaETH, Stable 등 파트너 상품에 맞춰 예치 한도를 조정하세요.</p>
        {!vault.isAllocator && <p className="muted warning">데모 모드: 컨트랙트 권한 검증 없이 편집 중입니다.</p>}

        <form className="stack" onSubmit={handleSubmit}>
          <label>최소 예치 금액 (USDC)</label>
          <input type="number" min="0" step="0.01" value={draft.minDeposit} onChange={(event) => handleChange("minDeposit", event.target.value)} />

          <label>최대 예치 금액 (USDC)</label>
          <input type="number" min="0" step="0.01" value={draft.maxDeposit} onChange={(event) => handleChange("maxDeposit", event.target.value)} />

          <label>예치 기간 (일)</label>
          <input type="number" min="1" step="1" value={draft.depositPeriodDays} onChange={(event) => handleChange("depositPeriodDays", event.target.value)} />

          <label>배분 토큰</label>
          <input type="text" value={draft.allocationToken} onChange={(event) => handleChange("allocationToken", event.target.value)} />

          <label>설명</label>
          <textarea value={draft.description} onChange={(event) => handleChange("description", event.target.value)} rows={3} />

          <label>지원 상품 목록</label>
          <input type="text" value={draft.supportedProducts} onChange={(event) => handleChange("supportedProducts", event.target.value)} placeholder="예: megaETH, Stable" />

          <div className="button-row">
            <button className="secondary" type="button" onClick={() => setDraft(settings)} disabled={disableForm || !hasChanges}>
              변경 취소
            </button>
            <button className="primary" type="submit" disabled={disableForm || !hasChanges}>
              {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save settings"}
            </button>
          </div>
        </form>
        <div className="muted info-note">현재 총 예치 금액: {totalDeposited} USDC</div>
      </section>

      <section className="card">
        <div className="pill">settlement</div>
        <h2>토큰 배분 & 초과 환불</h2>
        <p className="muted">
          관리자가 claim 버튼을 누르면 현재 저장된 모든 참가자에 대해 순차적으로 Monad 토큰이 배분되고 초과 예치분이 환불됩니다. 데모
          프로젝트이므로 주소 검증 없이 테스트할 수 있습니다.
        </p>
        {!participants.length ? (
          <p className="muted">아직 예치한 참가자가 없습니다.</p>
        ) : (
          <div className="settle-summary">
            <p>
              총 참가자: <strong>{participants.length}명</strong>
            </p>
            <p>
              총 예치 금액: <strong>{totalDeposited} USDC</strong>
            </p>
          </div>
        )}
        <button className="primary" type="button" disabled={!participants.length || settleStatus === "processing"} onClick={handleSettleAll}>
          {settleStatus === "processing" ? "Processing..." : "Claim & refund all"}
        </button>
      </section>

      <AdminPanel vault={vault} participants={participants} />
    </>
  );
}


