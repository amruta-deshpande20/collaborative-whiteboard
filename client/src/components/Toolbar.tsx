import { useState } from "react";

function Toolbar() {
  const [activeTool, setActiveTool] = useState("select");
  return (
    <div className="tool-buttons">
      <button
        className={activeTool === "select" ? "active" : ""}
        onClick={() => setActiveTool("select")}
      >
        Select
      </button>
      <button
        className={activeTool === "draw" ? "active" : ""}
        onClick={() => setActiveTool("draw")}
      >
        Draw
      </button>
      <button
        className={activeTool === "eraser" ? "active" : ""}
        onClick={() => setActiveTool("eraser")}
      >
        Eraser
      </button>
    </div>
  );
}
export default Toolbar;
