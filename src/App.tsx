import { useControls } from "leva";
import { HexCanvas } from "./components/HexCanvas.tsx";
import { CONFIG, VISIT_COLORS } from "./simulation/config.ts";
import "./App.css";

const LEGEND_LABELS = [
  "Unvisited",
  "1 visit",
  "2 visits",
  "3 visits",
  "4 visits",
  "5 visits",
  "6 visits",
  "7 visits",
  "8 visits",
  "> 8 visits",
];

function Legend() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        zIndex: 1000,
        background: "#181c20",
        borderRadius: 8,
        padding: "10px 14px",
        border: "1px solid #333",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#888",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        Number of visits
      </div>
      {VISIT_COLORS.map((color, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: color,
              border: "1px solid #555",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: "#ccc" }}>
            {LEGEND_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const { temperature, friction, stepsPerFrame } = useControls({
    temperature: {
      value: CONFIG.TEMPERATURE,
      min: 10,
      max: 2000,
      step: 10,
      label: "Temperature (T)",
    },
    friction: {
      value: CONFIG.FRICTION,
      min: 0.1,
      max: 50,
      step: 0.1,
      label: "Friction (γ)",
    },
    stepsPerFrame: {
      value: CONFIG.STEPS_PER_FRAME,
      min: 1,
      max: 50,
      step: 1,
      label: "Steps / Frame",
    },
  });

  return (
    <>
      <header id="header">
        <h1>Langevin Equation</h1>
        <p>
          Brownian motion on a hexagonal grid, driven by the Langevin equation.
          Tile color shows how many times the particle has visited each hex.
        </p>
      </header>
      <Legend />
      <div id="canvas-container">
        <HexCanvas
          temperature={temperature}
          friction={friction}
          stepsPerFrame={stepsPerFrame}
        />
      </div>
    </>
  );
}

export default App;
