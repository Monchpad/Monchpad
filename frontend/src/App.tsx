import { Routes, Route, Link } from "react-router-dom";
import { useStageVault } from "./hooks/useStageVault";
import { useServiceSettings } from "./hooks/useServiceSettings";
import { HomePage } from "./pages/HomePage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";

function App() {
  const vault = useStageVault();
  const { settings, updateSettings, loaded } = useServiceSettings();

  if (!loaded) {
    return (
      <div className="app">
        <header>
          <h1>Monad Buffered Deposits</h1>
        </header>
        <p className="muted">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <Link to="/" className="logo-link">
          <h1>Monad Buffered Deposits</h1>
        </Link>

        <div className="header__actions">
          <Link className="secondary" to="/admin">
            관리자 권한
          </Link>
          {vault.account ? (
            <p className="muted">Connected as {vault.account}</p>
          ) : (
            <button className="primary" onClick={() => vault.connect()}>
              Connect wallet
            </button>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage vault={vault} settings={settings} />} />
        <Route path="/admin" element={<AdminSettingsPage vault={vault} settings={settings} onSave={updateSettings} />} />
      </Routes>
    </div>
  );
}

export default App;

