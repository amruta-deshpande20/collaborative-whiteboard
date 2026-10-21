import { useRef, useState, useEffect } from "react";
import "./Whiteboard.css";

function Whiteboard() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoHistory, setRedoHistory] = useState<ImageData[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function getCanvasCoordinates(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;

    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDrawing(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { x, y } = getCanvasCoordinates(event);

    context.beginPath();
    context.globalCompositeOperation = isEraser
      ? "destination-out"
      : "source-over";

    context.strokeStyle = color;
    context.lineWidth = isEraser ? 20 : brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.moveTo(x, y);

    setRedoHistory([]);
    //save snapshot
    const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((previousHistory) => [...previousHistory, snapshot]);

    setIsDrawing(true);
  }

  function draw(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { x, y } = getCanvasCoordinates(event);

    context.lineTo(x, y);

    context.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);

    setHistory((previousHistory) => [...previousHistory, snapshot]);
    setRedoHistory([]);

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function undo() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    if (history.length === 0) return;

    // Save the current canvas for Redo
    const currentSnapshot = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    setRedoHistory((previousRedoHistory) => [
      ...previousRedoHistory,
      currentSnapshot,
    ]);

    // Retrieve the previous canvas state
    const previousHistory = [...history];
    const previousSnapshot = previousHistory.pop();

    if (!previousSnapshot) return;

    context.putImageData(previousSnapshot, 0, 0);

    setHistory(previousHistory);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      } else if (event.ctrlKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo]);

  function redo() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    if (redoHistory.length === 0) return;

    // Save the current canvas for Undo
    const currentSnapshot = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    setHistory((previousHistory) => [...previousHistory, currentSnapshot]);

    // Retrieve the next canvas state
    const updatedRedoHistory = [...redoHistory];
    const nextSnapshot = updatedRedoHistory.pop();

    if (!nextSnapshot) return;

    context.putImageData(nextSnapshot, 0, 0);

    setRedoHistory(updatedRedoHistory);
  }

  return (
    <main className="whiteboard-page">
      {" "}
      <header className="board-header">
        {" "}
        <div>
          {" "}
          <p className="eyebrow">CREATIVE SPACE</p>{" "}
          <h1>
            My Whiteboard<span>.</span>
          </h1>{" "}
          <p className="subtitle">A little space for your ideas.</p>{" "}
        </div>{" "}
        <div className="board-status"> </div>{" "}
      </header>{" "}
      <section className="board-workspace">
        {" "}
        <div className="toolbar">
          {" "}
          <div className="tool-group">
            {" "}
            <span className="tool-label">TOOLS</span>{" "}
            <button
              type="button"
              className={`tool-button ${!isEraser ? "active" : ""}`}
              aria-pressed={!isEraser}
              onClick={() => setIsEraser(false)}
            >
              {" "}
              <span className="tool-icon">✎</span> Pen{" "}
              {!isEraser && (
                <span className="active-indicator">Active</span>
              )}{" "}
            </button>{" "}
            <button
              type="button"
              className={`tool-button ${isEraser ? "active" : ""}`}
              aria-pressed={isEraser}
              onClick={() => setIsEraser(true)}
            >
              {" "}
              <span className="tool-icon">▱</span> Eraser{" "}
              {isEraser && (
                <span className="active-indicator">Active</span>
              )}{" "}
            </button>{" "}
          </div>{" "}
          <div className="toolbar-divider" />{" "}
          <div className="setting-group">
            {" "}
            <label className="tool-label" htmlFor="pen-color">
              {" "}
              COLOR{" "}
            </label>{" "}
            <div className="color-control">
              {" "}
              <input
                id="pen-color"
                type="color"
                value={color}
                disabled={isEraser}
                onChange={(event) => setColor(event.target.value)}
              />{" "}
              <span>{color.toUpperCase()}</span>{" "}
            </div>{" "}
          </div>{" "}
          <div className="toolbar-divider" />{" "}
          <div className="setting-group size-group">
            {" "}
            <label className="tool-label" htmlFor="brush-size">
              {" "}
              BRUSH SIZE{" "}
            </label>{" "}
            <select
              id="brush-size"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            >
              {" "}
              <option value={2}>Small</option> <option value={5}>Medium</option>{" "}
              <option value={10}>Large</option>{" "}
              <option value={20}>Extra Large</option>{" "}
            </select>{" "}
          </div>{" "}
        </div>{" "}
        <div className="canvas-frame">
          {" "}
          <div className="canvas-topline">
            <span>UNTITLED BOARD</span>
            <span>800 × 500</span>

            <div className="canvas-actions">
              <button className="action-button" onClick={undo} type="button">
                ↶ Undo
              </button>

              <button className="action-button" onClick={redo} type="button">
                ↷ Redo
              </button>

              <button
                className="clear-button"
                onClick={clearCanvas}
                type="button"
              >
                Clear Canvas
              </button>
            </div>
          </div>
          <canvas
            width={800}
            height={500}
            className={
              isEraser ? "drawing-canvas eraser-cursor" : "drawing-canvas"
            }
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />{" "}
        </div>{" "}
        <p className="board-hint">
          {" "}
          <span>TIP</span> Select a tool, choose your brush size, and start
          drawing.{" "}
        </p>{" "}
      </section>{" "}
    </main>
  );
}

export default Whiteboard;
