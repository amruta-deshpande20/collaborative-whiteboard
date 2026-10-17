import { useRef, useState } from "react";

function Whiteboard() {
  const [isDrawing, setIsDrawing] = useState(false);

  function startDrawing(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context?.beginPath();
    context.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    setIsDrawing(true);
  }

  function draw(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    context.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <canvas
      width={800}
      height={500}
      style={{ border: "1px solid black" }}
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}

export default Whiteboard;
