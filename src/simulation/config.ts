export const CONFIG = {
  // Hex grid
  GRID_COLS: 40,
  GRID_ROWS: 40,
  HEX_SIZE: 10, // pixel radius of each hex

  // Langevin equation parameters
  FRICTION: 5.0, // γ — drag coefficient
  TEMPERATURE: 1000, // T — thermal energy (controls noise amplitude)
  PARTICLE_MASS: 1.0, // m
  KB: 0.01, // Boltzmann-like constant (scaled for visual effect)

  // Simulation timing
  DT: 0.016, // timestep per Langevin step
  STEPS_PER_FRAME: 20, // Langevin steps computed per render frame
};

// Visit count → color (index 0 = unvisited, 1–8 = counts, 9 = >8)
export const VISIT_COLORS: string[] = [
  "#808080", // 0: unvisited (gray)
  "#1a1a1a", // 1: near-black
  "#4d1a00", // 2: dark brown
  "#802200", // 3: brown
  "#b33000", // 4: dark red
  "#e63900", // 5: red
  "#ff6600", // 6: orange
  "#ff9933", // 7: light orange
  "#ffcc00", // 8: gold
  "#ffee55", // 9: >8 yellow
];

export function visitColor(count: number): string {
  if (count <= 0) return VISIT_COLORS[0];
  if (count >= 9) return VISIT_COLORS[9];
  return VISIT_COLORS[count];
}
