import { useState } from "react";
import Header from "./components/Header";
// import Toolbar from "./components/Toolbar";
import Whiteboard from "./components/Whiteboard";
import Home from "./pages/Home";
import "./App.css";

function App() {
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  if (!showWhiteboard) {
    return <Home onStartCreating={() => setShowWhiteboard(true)} />;
  }
  return (
    <div className="app">
      <Header onGoHome={() => setShowWhiteboard(false)} />
      {/* <Toolbar /> */}
      <Whiteboard />
    </div>
  );
}

export default App;
