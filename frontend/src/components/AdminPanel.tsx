import { useEffect, useState } from "react";
import type { DemoParticipant, StageVaultContext } from "../types";

interface Row {
  address: string;
  allocation: string;
}

interface Props {
  vault: StageVaultContext;
  participants: DemoParticipant[];
}

export function AdminPanel({ vault, participants }: Props) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    setRows(participants.map((participant) => ({ address: participant.address, allocation: participant.deposited })));
  }, [participants]);

  const updateRow = (index: number, key: keyof Row, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const submit = async () => {
    const payload = rows.filter((row) => row.address && row.allocation).map((row) => ({ ...row }));
    if (!payload.length) return;
    await vault.recordAllocations(payload);
  };

  return (
    <div className="card">
      <div className="pill">allocator</div>
      <h2>Finalize allocations</h2>
      <p className="muted">
        Monad에서 분석한 결과를 바탕으로 참가자별 할당량을 기록합니다. 값은 USDC 단위입니다.
      </p>
      {!rows.length ? (
        <p className="muted">아직 예치한 참가자가 없습니다. 입금이 발생하면 리스트가 자동으로 채워집니다.</p>
      ) : (
        rows.map((row, index) => {
          const participant = participants[index];
          return (
            <div key={`row-${row.address}`}>
              <label>Participant address</label>
              <input type="text" value={row.address} readOnly />
              <p className="muted">Deposited: {participant?.deposited ?? "0"} USDC</p>
              <label>Allocation</label>
              <input type="number" min="0" step="0.000001" value={row.allocation} onChange={(event) => updateRow(index, "allocation", event.target.value)} />
            </div>
          );
        })
      )}
      <button className="primary" type="button" disabled={!rows.length || vault.loadingAction === "allocate"} onClick={submit}>
        {vault.loadingAction === "allocate" ? "Submitting..." : "Record allocations"}
      </button>
    </div>
  );
}

