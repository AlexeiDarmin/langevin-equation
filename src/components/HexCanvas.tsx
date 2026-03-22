import { useRef, useEffect } from "react";
import { CONFIG, visitColor } from "../simulation/config.ts";
import {
  hexToPixel,
  hexCorners,
  pixelToHex,
  createGrid,
  recordVisit,
  getVisitCount,
  allHexes,
  gridPixelBounds,
  centerHex,
  isValidHex,
  clampHex,
} from "../simulation/hexGrid.ts";
import {
  createLangevinState,
  langevinStep,
} from "../simulation/langevin.ts";
import type { LangevinParams } from "../simulation/langevin.ts";
import type { HexGrid } from "../simulation/hexGrid.ts";

interface HexCanvasProps {
  temperature: number;
  friction: number;
  stepsPerFrame: number;
}

export function HexCanvas({ temperature, friction, stepsPerFrame }: HexCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(createLangevinState());
  const gridRef = useRef<HexGrid>(createGrid());
  const startHexRef = useRef<{ q: number; r: number } | null>(null);
  const currentHexRef = useRef<{ q: number; r: number } | null>(null);
  const animRef = useRef<number>(0);

  const { GRID_COLS, GRID_ROWS, HEX_SIZE, PARTICLE_MASS, KB, DT } = CONFIG;

  // Compute canvas dimensions from grid
  const bounds = gridPixelBounds(GRID_COLS, GRID_ROWS, HEX_SIZE);
  const canvasWidth = Math.ceil(bounds.width) + 20;
  const canvasHeight = Math.ceil(bounds.height) + 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;
    const grid = gridRef.current;

    // Center hex of the grid
    const center = centerHex(GRID_COLS, GRID_ROWS);
    const centerPixel = hexToPixel(center.q, center.r, HEX_SIZE);

    // Canvas offset so the center hex maps to the center of the canvas
    const ox = canvasWidth / 2 - centerPixel.x;
    const oy = canvasHeight / 2 - centerPixel.y;

    // Initialize particle at center hex on first run
    if (!startHexRef.current) {
      state.x = centerPixel.x;
      state.y = centerPixel.y;
      startHexRef.current = { q: center.q, r: center.r };
      currentHexRef.current = { q: center.q, r: center.r };
      recordVisit(grid, center.q, center.r);
    }

    const params: LangevinParams = {
      friction,
      temperature,
      mass: PARTICLE_MASS,
      kb: KB,
      dt: DT,
    };

    function drawHexTile(cx: number, cy: number, fillColor: string) {
      const corners = hexCorners(cx, cy, HEX_SIZE);
      ctx!.beginPath();
      ctx!.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < 6; i++) {
        ctx!.lineTo(corners[i].x, corners[i].y);
      }
      ctx!.closePath();
      ctx!.fillStyle = fillColor;
      ctx!.fill();
      ctx!.strokeStyle = "#555";
      ctx!.lineWidth = 0.5;
      ctx!.stroke();
    }

    function frame() {
      // Physics steps
      for (let i = 0; i < stepsPerFrame; i++) {
        langevinStep(state, params);

        // Convert continuous position to hex and clamp to grid bounds
        let hex = pixelToHex(state.x, state.y, HEX_SIZE);
        if (!isValidHex(hex.q, hex.r, GRID_COLS, GRID_ROWS)) {
          hex = clampHex(hex.q, hex.r, GRID_COLS, GRID_ROWS);
          const snapped = hexToPixel(hex.q, hex.r, HEX_SIZE);
          state.vx = -state.vx;
          state.vy = -state.vy;
          state.x = snapped.x;
          state.y = snapped.y;
        }

        // Track hex changes and record visits
        const cur = currentHexRef.current!;
        if (hex.q !== cur.q || hex.r !== cur.r) {
          recordVisit(grid, hex.q, hex.r);
          currentHexRef.current = { q: hex.q, r: hex.r };
        }
      }

      // Clear canvas
      ctx!.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw all hex tiles
      for (const { q, r } of allHexes(GRID_COLS, GRID_ROWS)) {
        const { x, y } = hexToPixel(q, r, HEX_SIZE);
        const count = getVisitCount(grid, q, r);
        drawHexTile(x + ox, y + oy, visitColor(count));
      }

      // Draw start position marker (hollow circle at center hex)
      const startHex = startHexRef.current!;
      const { x: sx, y: sy } = hexToPixel(startHex.q, startHex.r, HEX_SIZE);
      ctx!.beginPath();
      ctx!.arc(sx + ox, sy + oy, 4, 0, Math.PI * 2);
      ctx!.strokeStyle = "#fff";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Draw current particle snapped to hex center (discrete jumps, no jitter)
      const curHex = currentHexRef.current!;
      const { x: dx, y: dy } = hexToPixel(curHex.q, curHex.r, HEX_SIZE);
      ctx!.beginPath();
      ctx!.arc(dx + ox, dy + oy, 3, 0, Math.PI * 2);
      ctx!.fillStyle = "#fff";
      ctx!.fill();
      ctx!.strokeStyle = "#333";
      ctx!.lineWidth = 1;
      ctx!.stroke();

      animRef.current = requestAnimationFrame(frame);
    }

    animRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [
    temperature,
    friction,
    stepsPerFrame,
    canvasWidth,
    canvasHeight,
    GRID_COLS,
    GRID_ROWS,
    HEX_SIZE,
    PARTICLE_MASS,
    KB,
    DT,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ display: "block" }}
    />
  );
}
