// Cozy Jigsaw — piece shapes.
// Every edge between two pieces is drawn once, in board coordinates, so neighbours always fit exactly.
// An edge is a list of points: start, then (control 1, control 2, end) for each cubic curve.
(function (root) {
  const CJ = (root.CJ = root.CJ || {});

  // A small seeded random, so the same level always cuts the same way.
  CJ.rng = function (seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };

  // One classic tab along an edge from (0,0) to (1,0); y > 0 is the bump. jitter moves the tab a little.
  function tab(j) {
    const c = 0.5 + j.c, w = 1 + j.w, h = 1 + j.h;
    const X = (x) => c + (x - 0.5) * w, Y = (y) => y * h;
    return [
      [0, 0],
      [X(0.30), 0], [X(0.42), Y(0.02)], [X(0.38), Y(0.09)],
      [X(0.33), Y(0.18)], [X(0.40), Y(0.255)], [X(0.50), Y(0.255)],
      [X(0.60), Y(0.255)], [X(0.67), Y(0.18)], [X(0.62), Y(0.09)],
      [X(0.58), Y(0.02)], [X(0.70), 0], [1, 0],
    ];
  }

  // Cuts an n x n board of size B. Returns { s, pieces: [{ id, r, c, x, y, path(Path2D, piece-local), edges }] }.
  CJ.cut = function (n, B, seed) {
    const rnd = CJ.rng(seed || 1), s = B / n;
    const jit = () => ({ c: (rnd() - 0.5) * 0.08, w: (rnd() - 0.5) * 0.1, h: (rnd() - 0.5) * 0.12 });
    // Horizontal edges: hz[r][c] is the edge below row r-1 / above row r (r = 1..n-1), drawn left to right.
    const line = (x0, y0, x1, y1) => [[x0, y0], [x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3], [x0 + 2 * (x1 - x0) / 3, y0 + 2 * (y1 - y0) / 3], [x1, y1]];
    const edge = (x0, y0, dx, dy, nx, ny, sign) => tab(jit()).map(([t, h]) => [x0 + dx * t + nx * h * sign * s, y0 + dy * t + ny * h * sign * s]);
    const hz = [], vt = [];
    for (let r = 0; r <= n; r++) {
      hz[r] = [];
      for (let c = 0; c < n; c++) {
        const x0 = c * s, y0 = r * s;
        hz[r][c] = r === 0 || r === n ? line(x0, y0, x0 + s, y0) : edge(x0, y0, s, 0, 0, 1, rnd() < 0.5 ? 1 : -1);
      }
    }
    for (let c = 0; c <= n; c++) {
      vt[c] = [];
      for (let r = 0; r < n; r++) {
        const x0 = c * s, y0 = r * s;
        vt[c][r] = c === 0 || c === n ? line(x0, y0, x0, y0 + s) : edge(x0, y0, 0, s, 1, 0, rnd() < 0.5 ? 1 : -1);
      }
    }
    const rev = (pts) => pts.slice().reverse();
    const pieces = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const x = c * s, y = r * s;
      // Clockwise: top (left→right), right (top→bottom), bottom (right→left), left (bottom→top).
      const loop = [hz[r][c], vt[c + 1][r], rev(hz[r + 1][c]), rev(vt[c][r])];
      const p = new Path2D();
      p.moveTo(loop[0][0][0] - x, loop[0][0][1] - y);
      for (const e of loop) for (let i = 1; i < e.length; i += 3) p.bezierCurveTo(e[i][0] - x, e[i][1] - y, e[i + 1][0] - x, e[i + 1][1] - y, e[i + 2][0] - x, e[i + 2][1] - y);
      p.closePath();
      pieces.push({ id: r * n + c, r, c, x, y, path: p, edge: r === 0 || c === 0 || r === n - 1 || c === n - 1 });
    }
    return { n, s, B, pieces };
  };
})(typeof window !== 'undefined' ? window : globalThis);
