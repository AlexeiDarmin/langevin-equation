// Langevin equation solver using Euler-Maruyama integration.
//
// The Langevin equation for a Brownian particle:
//   m dv/dt = -γv + σW(t)
//
// where:
//   γ = friction coefficient
//   σ = √(2γ k_B T)  — noise amplitude (fluctuation-dissipation relation)
//   W(t) = Gaussian white noise
//
// Discretized (Euler-Maruyama):
//   v(t+Δt) = v(t) − (γ/m)·v(t)·Δt + (σ/m)·√Δt·N(0,1)
//   x(t+Δt) = x(t) + v(t+Δt)·Δt

export interface LangevinState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface LangevinParams {
  friction: number; // γ
  temperature: number; // T
  mass: number; // m
  kb: number; // Boltzmann-like constant
  dt: number; // timestep
}

/** Box-Muller transform: generate a standard normal random number. */
function gaussianRandom(): number {
  let u1 = 0;
  let u2 = 0;
  // Avoid log(0)
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/** Advance the Langevin state by one timestep. */
export function langevinStep(
  state: LangevinState,
  params: LangevinParams,
): void {
  const { friction, temperature, mass, kb, dt } = params;

  // Noise amplitude from fluctuation-dissipation theorem
  const sigma = Math.sqrt(2 * friction * kb * temperature);
  const sqrtDt = Math.sqrt(dt);

  // Euler-Maruyama velocity update
  state.vx += (-friction / mass) * state.vx * dt + (sigma / mass) * sqrtDt * gaussianRandom();
  state.vy += (-friction / mass) * state.vy * dt + (sigma / mass) * sqrtDt * gaussianRandom();

  // Position update
  state.x += state.vx * dt;
  state.y += state.vy * dt;
}

/**
 * Reflect the particle off world boundaries (pixel space).
 * The world is centered at (0, 0) with half-extents (hw, hh).
 */
export function reflectBoundaries(
  state: LangevinState,
  halfWidth: number,
  halfHeight: number,
): void {
  if (state.x < -halfWidth) {
    state.x = -halfWidth + (-halfWidth - state.x);
    state.vx = Math.abs(state.vx);
  } else if (state.x > halfWidth) {
    state.x = halfWidth - (state.x - halfWidth);
    state.vx = -Math.abs(state.vx);
  }

  if (state.y < -halfHeight) {
    state.y = -halfHeight + (-halfHeight - state.y);
    state.vy = Math.abs(state.vy);
  } else if (state.y > halfHeight) {
    state.y = halfHeight - (state.y - halfHeight);
    state.vy = -Math.abs(state.vy);
  }
}

export function createLangevinState(): LangevinState {
  return { x: 0, y: 0, vx: 0, vy: 0 };
}
