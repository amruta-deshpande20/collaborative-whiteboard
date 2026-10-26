import { useRef, useState, useEffect } from "react";
import { socket } from "../socket";
import "./Whiteboard.css";

function Whiteboard() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [boardName, setBoardName] = useState("My Whiteboard");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoHistory, setRedoHistory] = useState<ImageData[]>([]);
  const [savedBoards, setSavedBoards] = useState<any[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const redoHistoryRef = useRef<ImageData[]>([]);

  useEffect(() => {
    historyRef.current = history;
    redoHistoryRef.current = redoHistory;
  }, [history, redoHistory]);

  function getCanvasCoordinates(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;

    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDrawing(event: React.MouseEvent<HTMLCanvasElement>) {
    console.log("Mouse down detected");
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

    socket.emit("drawing-start", {
      x,
      y,
      color,
      brushSize,
      isEraser,
    });

    setRedoHistory([]);
    //save snapshot
    const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((previousHistory) => [...previousHistory, snapshot]);

    isDrawingRef.current = true;
    setIsDrawing(true);
    console.log("Ref after starting:", isDrawingRef.current);
  }

  function draw(event: React.MouseEvent<HTMLCanvasElement>) {
    console.log("Ref value:", isDrawingRef.current);

    if (!isDrawingRef.current) {
      console.log("Drawing stopped: ref is false");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const { x, y } = getCanvasCoordinates(event);

    context.lineTo(x, y);

    context.stroke();
    socket.emit("drawing", {
      x,
      y,
      color,
      brushSize,
      isEraser,
    });
  }

  function handleRemoteUndo() {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const currentSnapshot = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    historyRef.current = [...historyRef.current, currentSnapshot];
    setHistory(historyRef.current);

    const updatedHistory = [...historyRef.current];
    const previousSnapshot = updatedHistory.pop();
    if (!previousSnapshot) return;

    context.putImageData(previousSnapshot, 0, 0);
    historyRef.current = updatedHistory;
    setHistory(updatedHistory);
  }

  function handleRemoteRedo() {
    const canvas = canvasRef.current;
    if (!canvas || redoHistoryRef.current.length === 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const currentSnapshot = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    redoHistoryRef.current = [...redoHistoryRef.current, currentSnapshot];
    setRedoHistory(redoHistoryRef.current);

    const updatedRedoHistory = [...redoHistoryRef.current];
    const nextSnapshot = updatedRedoHistory.pop();
    if (!nextSnapshot) return;

    context.putImageData(nextSnapshot, 0, 0);
    redoHistoryRef.current = updatedRedoHistory;
    setRedoHistory(updatedRedoHistory);
  }

  useEffect(() => {
    function handleRemoteDrawing(data: {
      x: number;
      y: number;
      color: string;
      brushSize: number;
      isEraser: boolean;
    }) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.globalCompositeOperation = data.isEraser
        ? "destination-out"
        : "source-over";

      context.strokeStyle = data.color;
      context.lineWidth = data.isEraser ? 20 : data.brushSize;
      context.lineCap = "round";
      context.lineJoin = "round";

      context.lineTo(data.x, data.y);
      context.stroke();
    }

    function handleCanvasUpdate(imageData: string) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const image = new Image();

      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };

      image.src = imageData;
    }

    function handleRemoteDrawingStart(data: {
      x: number;
      y: number;
      color: string;
      brushSize: number;
      isEraser: boolean;
    }) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.beginPath();
      context.globalCompositeOperation = data.isEraser
        ? "destination-out"
        : "source-over";
      context.strokeStyle = data.color;
      context.lineWidth = data.isEraser ? 20 : data.brushSize;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.moveTo(data.x, data.y);
    }

    socket.on("drawing-start", handleRemoteDrawingStart);

    socket.on("drawing", handleRemoteDrawing);

    socket.on("undo", handleRemoteUndo);
    socket.on("redo", handleRemoteRedo);
    socket.on("canvas-update", handleCanvasUpdate);

    return () => {
      socket.off("drawing", handleRemoteDrawing);
      socket.off("drawing-start", handleRemoteDrawingStart);
      socket.off("undo", handleRemoteUndo);
      socket.off("redo", handleRemoteRedo);
      socket.off("canvas-update", handleCanvasUpdate);
    };
  }, []);

  function stopDrawing(event: React.MouseEvent<HTMLCanvasElement>) {
    console.log("stopDrawing called by:", event.type);

    isDrawingRef.current = false;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL("image/png");
    localStorage.setItem("gatherboard-drawing", imageData);
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

    localStorage.setItem("gatherboard-drawing", canvas.toDataURL("image/png"));
    socket.emit("canvas-update", canvas.toDataURL("image/png"));
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

    redoHistoryRef.current = [...redoHistoryRef.current, currentSnapshot];
    setRedoHistory(redoHistoryRef.current);

    // Retrieve the previous canvas state
    const previousHistory = [...history];
    const previousSnapshot = previousHistory.pop();

    if (!previousSnapshot) return;

    context.putImageData(previousSnapshot, 0, 0);
    localStorage.setItem("gatherboard-drawing", canvas.toDataURL("image/png"));

    historyRef.current = previousHistory;
    setHistory(previousHistory);
    socket.emit("canvas-update", canvas.toDataURL("image/png"));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isNewSession = !sessionStorage.getItem("gatherboard-session");

    if (isNewSession) {
      localStorage.removeItem("gatherboard-drawing");
      sessionStorage.setItem("gatherboard-session", "active");
    }

    const savedDrawing = localStorage.getItem("gatherboard-drawing");
    if (!savedDrawing) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();

    image.onload = () => {
      context.drawImage(image, 0, 0);
    };

    image.src = savedDrawing;
  }, []);

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

  useEffect(() => {
    console.log("Whiteboard MOUNTED");

    return () => {
      console.log("Whiteboard UNMOUNTED");
    };
  }, []);

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

    historyRef.current = [...historyRef.current, currentSnapshot];
    setHistory(historyRef.current);

    // Retrieve the next canvas state
    const updatedRedoHistory = [...redoHistory];
    const nextSnapshot = updatedRedoHistory.pop();

    if (!nextSnapshot) return;

    context.putImageData(nextSnapshot, 0, 0);
    localStorage.setItem("gatherboard-drawing", canvas.toDataURL("image/png"));

    redoHistoryRef.current = updatedRedoHistory;
    setRedoHistory(updatedRedoHistory);
    socket.emit("canvas-update", canvas.toDataURL("image/png"));
  }

  const saveBoard = async () => {
    if (!boardName.trim()) {
      alert("Please enter a board name.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);

    try {
      const response = await fetch("http://localhost:3001/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: boardName.trim(),
          canvasData: canvas.toDataURL("image/png"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save board");
      }

      alert("Board saved successfully!");
    } catch (error) {
      console.error("Error saving board:", error);
      alert("Could not save the board. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchSavedBoards = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/boards");

      if (!response.ok) {
        throw new Error("Failed to fetch boards");
      }

      const boards = await response.json();
      setSavedBoards(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
    }
  };

  useEffect(() => {
    fetchSavedBoards();
  }, []);

  const loadBoard = (canvasData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();

    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
    };

    image.src = canvasData;
  };

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
      {/* {savedBoards.length > 0 && (
        <div className="saved-boards">
          <h3>My Saved Boards</h3> */}
      {/* {savedBoards.map((board) => (
        <button
          key={board._id}
          className={`saved-board-item ${
            selectedBoardId === board._id ? "selected" : ""
          }`}
          onClick={() => {
            loadBoard(board.canvasData);
            setBoardName(board.name);
            setSelectedBoardId(board._id);
          }}
        >
          {board.name}
        </button>
      ))}
      {/* </div> */}
      {/* )} */}
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
        <div className="workspace-content">
          <aside className="saved-boards-sidebar">
            <h3>Saved Boards</h3>

            {savedBoards.length === 0 ? (
              <p>No saved boards yet.</p>
            ) : (
              savedBoards.map((board) => (
                <button
                  key={board._id}
                  className={`saved-board-item ${
                    selectedBoardId === board._id ? "selected" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    loadBoard(board.canvasData);
                    setBoardName(board.name);
                    setSelectedBoardId(board._id);
                  }}
                >
                  {board.name}
                </button>
              ))
            )}
          </aside>

          <div className="canvas-area">
            <div className="canvas-frame"></div>{" "}
            <div className="canvas-topline">
              <input
                type="text"
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
                placeholder="Enter board name"
                aria-label="Board name"
              />
              <span>800 × 500</span>

              <div className="canvas-actions">
                <button
                  className="action-button"
                  onClick={saveBoard}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Board"}
                </button>

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
          </div>
        </div>
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
