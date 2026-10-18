type HeaderProps = {
  onGoHome: () => void;
};

function Header({ onGoHome }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">*</span>
        <span>Gatherboard</span>
      </div>

      <div className="board-info">
        <span className="board-title">Untitled Board</span>
        <span className="save-status">All changes saved</span>
      </div>

      <div className="header-actions">
        <div className="collaborators">
          <span className="avatar">A</span>
          <span className="avatar">S</span>
        </div>

        <button className="home-button" onClick={onGoHome}>
          {" "}
          ← Home{" "}
        </button>

        <button className="share-button">Share</button>
      </div>
    </header>
  );
}
export default Header; //reusable
