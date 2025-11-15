import type { StageVaultContext, ServiceSettings } from "../types";
import { DepositCard } from "../components/DepositCard";

interface Props {
  vault: StageVaultContext;
  settings: ServiceSettings;
}

export function HomePage({ vault, settings }: Props) {
  return (
    <>
      <section className="app__grid">
        <DepositCard vault={vault} settings={settings} />
      </section>

      <section className="card highlight">
        <h3>현재 서비스 조건</h3>
        <p className="muted">{settings.description}</p>
        <ul className="info-list">
          <li>
            <strong>최소 예치 금액</strong>
            <span>{settings.minDeposit} USDC</span>
          </li>
          <li>
            <strong>최대 예치 금액</strong>
            <span>{settings.maxDeposit} USDC</span>
          </li>
          <li>
            <strong>예치 기간</strong>
            <span>{settings.depositPeriodDays}일</span>
          </li>
          <li>
            <strong>배분 토큰</strong>
            <span>{settings.allocationToken}</span>
          </li>
          <li>
            <strong>지원 상품</strong>
            <span>{settings.supportedProducts}</span>
          </li>
        </ul>
      </section>
    </>
  );
}

