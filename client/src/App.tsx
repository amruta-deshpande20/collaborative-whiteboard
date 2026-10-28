import { useState, useEffect } from "react";
import { socket } from "./socket";
import Header from "./components/Header";
import Whiteboard from "./components/Whiteboard";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import JoinBoard from "./pages/JoinBoard";

type User = {
  name: string;
  email: string;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/join/:token" element={<JoinBoard />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppContent() {
  const [showWhiteboard, setShowWhiteboard] = useState(
    () => sessionStorage.getItem("gatherboard-page") === "board",
  );

  const [token, setToken] = useState(
    () => sessionStorage.getItem("gatherboard-token") || "",
  );

  const [showSharePopup, setShowSharePopup] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [shareError, setShareError] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem("gatherboard-user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.log("Connection error:", error.message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, []);

  function handleLogin(newToken: string, loggedInUser: User) {
    sessionStorage.setItem("gatherboard-token", newToken);
    sessionStorage.setItem("gatherboard-user", JSON.stringify(loggedInUser));

    socket.auth = {
      token: newToken,
    };

    socket.connect();

    setToken(newToken);
    setUser(loggedInUser);
    setShowWhiteboard(true);
    sessionStorage.setItem("gatherboard-page", "board");

    const pendingInvite = sessionStorage.getItem("gatherboard-pending-invite");

    if (pendingInvite) {
      window.location.href = `/join/${pendingInvite}`;
      return;
    }
  }

  function handleLogout() {
    socket.disconnect();
    sessionStorage.removeItem("gatherboard-token");
    sessionStorage.removeItem("gatherboard-user");
    sessionStorage.removeItem("gatherboard-page");

    setToken("");
    setUser(null);
    setShowWhiteboard(false);
  }

  if (!token || !user) {
    return (
      <>
        {!showWhiteboard ? (
          <Home onStartCreating={() => setShowWhiteboard(true)} />
        ) : (
          <Auth onLogin={handleLogin} />
        )}
      </>
    );
  }

  async function handleShare() {
    if (!selectedBoardId) {
      setShareError("Save or open a board before sharing.");
      setShowSharePopup(true);
      return;
    }

    const token = sessionStorage.getItem("gatherboard-token");
    if (!token) return;

    setShowSharePopup(true);
    setIsSharing(true);
    setShareError("");
    setShareLink("");
    setShareCode("");

    try {
      const response = await fetch(
        `http://localhost:3001/api/boards/${selectedBoardId}/invite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create invitation.");
      }

      setShareLink(data.shareLink);
      setShareCode(data.shareCode);
    } catch (error) {
      setShareError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="app">
      <Header
        onGoHome={handleLogout}
        onShare={handleShare}
        onLogout={handleLogout}
      />
      {/* 
      <div className="workspace-welcome">Welcome, {user.name}</div> */}

      <Whiteboard
        onBoardSelect={setSelectedBoardId}
        boardToOpen={sessionStorage.getItem("gatherboard-open-board")}
      />
      {showSharePopup && (
        <div className="share-overlay">
          <div className="share-modal">
            <button
              className="share-close"
              onClick={() => setShowSharePopup(false)}
            >
              ×
            </button>

            <h2>Share your board</h2>
            <p>Invite someone to collaborate with you.</p>

            {isSharing && <p>Generating invitation...</p>}
            {shareError && <p className="share-error">{shareError}</p>}

            {shareLink && (
              <>
                <label>Invitation link</label>
                <div className="share-copy-row">
                  <input value={shareLink} readOnly />
                  <button
                    onClick={() => navigator.clipboard.writeText(shareLink)}
                  >
                    Copy
                  </button>
                </div>

                <label>Join code</label>
                <div className="share-copy-row">
                  <input value={shareCode} readOnly />
                  <button
                    onClick={() => navigator.clipboard.writeText(shareCode)}
                  >
                    Copy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
