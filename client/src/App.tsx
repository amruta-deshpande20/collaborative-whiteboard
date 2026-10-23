import { useState, useEffect } from "react";
import { socket } from "./socket";
import Header from "./components/Header";
// import Toolbar from "./components/Toolbar";
import Whiteboard from "./components/Whiteboard";
import Home from "./pages/Home";
import "./App.css";

function App() {
  const [showWhiteboard, setShowWhiteboard] = useState(
    () => sessionStorage.getItem("gatherboard-page") === "board",
  );

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

  if (!showWhiteboard) {
    return (
      <Home
        onStartCreating={() => {
          sessionStorage.setItem("gatherboard-page", "board");
          setShowWhiteboard(true);
        }}
      />
    );
  }
  return (
    <div className="app">
      <Header
        onGoHome={() => {
          sessionStorage.removeItem("gatherboard-page");
          setShowWhiteboard(false);
        }}
      />
      {/* <Toolbar /> */}
      <Whiteboard />
    </div>
  );
}

export default App;
