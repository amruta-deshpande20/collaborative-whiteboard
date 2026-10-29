// import { useState } from "react";

type HeaderProps = {
  onGoHome: () => void;
  onShare: () => void;
  onLogout: () => void;
};

function Header({ onGoHome, onShare, onLogout }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">*</span>
        <span>Gatherboard</span>
      </div>

      <div className="header-actions">
        <button className="home-button" onClick={onGoHome}>
          ← Home
        </button>

        <button className="share-button" onClick={onShare}>
          Share
        </button>
        <button className="logout-button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}

export default Header;
