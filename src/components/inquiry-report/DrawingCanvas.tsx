"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COLORS = ["#1e293b", "#dc2626", "#2563eb", "#16a34a", "#9333ea"];
const WIDTH = 640;
const HEIGHT = 400;

interface DrawingCanvasProps {
  value: string;
  onChange: (dataUrl: string) => void;
  readOnly?: boolean;
}

function canvasHasDrawing(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i]! < 250 || data[i + 1]! < 250 || data[i + 2]! < 250) return true;
  }
  return false;
}

export function DrawingCanvas({ value, onChange, readOnly = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastLoadedRef = useRef(value);
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(3);
  const [eraser, setEraser] = useState(false);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dataUrl = canvasHasDrawing(ctx, canvas.width, canvas.height)
      ? canvas.toDataURL("image/jpeg", 0.85)
      : "";
    lastLoadedRef.current = dataUrl;
    onChange(dataUrl);
  }, [onChange]);

  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = eraser ? "#ffffff" : color;
      ctx.lineWidth = eraser ? lineWidth * 3 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [color, eraser, lineWidth],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (readOnly) return;
      e.preventDefault();
      const point = getPoint(e);
      if (!point) return;
      drawingRef.current = true;
      lastPointRef.current = point;
    },
    [getPoint, readOnly],
  );

  const moveDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawingRef.current || readOnly) return;
      e.preventDefault();
      const point = getPoint(e);
      const last = lastPointRef.current;
      if (!point || !last) return;
      drawLine(last, point);
      lastPointRef.current = point;
    },
    [drawLine, getPoint, readOnly],
  );

  const endDraw = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    exportImage();
  }, [exportImage]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || readOnly) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    lastLoadedRef.current = "";
    onChange("");
  }, [onChange, readOnly]);

  const loadImage = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = src;
  }, []);

  useEffect(() => {
    if (value === lastLoadedRef.current) return;
    lastLoadedRef.current = value;
    loadImage(value);
  }, [value, loadImage]);

  useEffect(() => {
    loadImage(value);
    lastLoadedRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (readOnly && value) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="학생 그림" className="w-full" />
      </div>
    );
  }

  if (readOnly && !value) {
    return <p className="text-sm text-slate-400">그림이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`색상 ${c}`}
              onClick={() => {
                setColor(c);
                setEraser(false);
              }}
              className={`h-7 w-7 rounded-full border-2 ${color === c && !eraser ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          굵기
          <input
            type="range"
            min={1}
            max={12}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20"
          />
        </label>
        <button
          type="button"
          onClick={() => setEraser((e) => !e)}
          className={`rounded-lg border px-3 py-1 text-xs ${eraser ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
        >
          지우개
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          전체 지우기
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border-2 border-slate-300 bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="block w-full cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
        />
      </div>
      <p className="text-xs text-slate-500 print:hidden">마우스나 손가락으로 그림을 그려보세요.</p>
    </div>
  );
}
