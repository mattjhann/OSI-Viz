import { motion } from 'framer-motion';

// How far a blocked link is drawn before it stops dead (as a fraction of the
// full source→target distance) — the packet never reaches the other node.
const BLOCK_STOP = 0.55;

// Approximate "reach" of each node shape, in viewBox units — used to offset
// line endpoints so they meet the node's edge rather than its center.
const REACH = { circle: 5, box: 10.5 };

export default function McastTopology({ nodes, links, accentColor, reducedMotion = false }) {
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="mcast-topology"
      viewBox="0 0 100 60"
      role="img"
      aria-label="Multicast-over-tunnel topology"
      style={{ '--block-accent': accentColor }}
    >
      {/* Links */}
      {links.map((l) => {
        const a = nodeById[l.from];
        const b = nodeById[l.to];
        if (!a || !b) return null;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const sx = a.x + ux * REACH[a.shape];
        const sy = a.y + uy * REACH[a.shape];
        const fullEx = b.x - ux * REACH[b.shape];
        const fullEy = b.y - uy * REACH[b.shape];
        const blocked = l.state === 'blocked';
        const ex = blocked ? sx + (fullEx - sx) * BLOCK_STOP : fullEx;
        const ey = blocked ? sy + (fullEy - sy) * BLOCK_STOP : fullEy;
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;
        const cls = `mcast-link mcast-link--${l.style} ${blocked ? 'is-blocked' : 'is-active'}`;

        return (
          <g key={l.id}>
            <line className={cls} x1={sx} y1={sy} x2={ex} y2={ey} />
            {blocked && (
              <text className="mcast-link__x" x={ex} y={ey + 1.4} textAnchor="middle">
                ✕
              </text>
            )}
            {!blocked && !reducedMotion && (
              <motion.circle
                className="mcast-link__dot"
                r={1.3}
                initial={{ cx: sx, cy: sy, opacity: 0 }}
                animate={{ cx: [sx, mx, ex], cy: [sy, my, ey], opacity: [0, 1, 0] }}
                transition={{ duration: 1.3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.35 }}
              />
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const above = n.y > 34;
        const ly = n.shape === 'box' ? (above ? n.y - 7.5 : n.y + 9.5) : above ? n.y - 6.6 : n.y + 8.8;
        const cls = `mcast-node mcast-node--${n.shape} is-${n.role}`;
        return (
          <g key={n.id} className={cls}>
            {n.shape === 'circle' ? (
              <circle className="mcast-node__shape" cx={n.x} cy={n.y} r={4.6} />
            ) : (
              <rect className="mcast-node__shape" x={n.x - 11} y={n.y - 4.6} width={22} height={9.2} rx={2} />
            )}
            <text className="mcast-node__label" x={n.x} y={ly} textAnchor="middle">
              {n.label}
            </text>
            <text className="mcast-node__sub" x={n.x} y={ly + 3.3} textAnchor="middle">
              {n.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
