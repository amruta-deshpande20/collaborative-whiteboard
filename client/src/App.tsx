import { useState } from "react";
import Header from "./components/Header";
// import Toolbar from "./components/Toolbar";
import Whiteboard from "./components/Whiteboard";
import Home from "./pages/Home";
import "./App.css";

function App() {
  const [showWhiteboard, setShowWhiteboard] = useState(
    () => sessionStorage.getItem("gatherboard-page") === "board",
  );
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
