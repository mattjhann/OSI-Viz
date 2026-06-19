import { motion } from 'framer-motion';
import { AS_NODES, LINKS } from '../data/bgpRouting.js';

const NODE_BY_ID = Object.fromEntries(AS_NODES.map((n) => [n.id, n]));
const key = (a, b) => [a, b].sort().join('|');

export default function BgpTopology({ learned = [], activePath = [], downLinks = [], flow = false, arrows = [], accentColor, reducedMotion = false }) {
  const learnedSet = new Set(learned);
  const downSet = new Set(downLinks.map(([a, b]) => key(a, b)));

  // Links that make up the currently-installed path (consecutive pairs).
  const activeSet = new Set();
  for (let i = 0; i < activePath.length - 1; i += 1) {
    activeSet.add(key(activePath[i], activePath[i + 1]));
  }
  const onActivePath = new Set(activePath);

  // Coordinates the traffic dot travels through along the active path.
  const pathPts = activePath.map((id) => NODE_BY_ID[id]).filter(Boolean);
  const showDot = flow && !reducedMotion && pathPts.length >= 2;

  return (
    <svg className="bgp-topology" viewBox="0 0 100 60" role="img" aria-label="BGP autonomous-system topology" style={{ '--block-accent': accentColor }}>
      {/* Links */}
      {LINKS.map((l) => {
        const a = NODE_BY_ID[l.a];
        const b = NODE_BY_ID[l.b];
        const k = key(l.a, l.b);
        const down = downSet.has(k);
        const active = activeSet.has(k) && !down;
        const cls = `bgp-link ${active ? 'is-active' : ''} ${down ? 'is-down' : ''}`;
        return (
          <g key={l.id}>
            <line className={cls} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            {down && (
              <text className="bgp-link__x" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 + 1.4} textAnchor="middle">
                ✕
              </text>
            )}
          </g>
        );
      })}

      {/* Propagation arrows — animated dots showing UPDATE direction */}
      {arrows.map(([fromId, toId], i) => {
        const a = NODE_BY_ID[fromId];
        const b = NODE_BY_ID[toId];
        if (!a || !b) return null;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const r = 4.4;
        const sx = a.x + (dx / len) * r;
        const sy = a.y + (dy / len) * r;
        const ex = b.x - (dx / len) * r;
        const ey = b.y - (dy / len) * r;
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;
        const angle = Math.atan2(ey - sy, ex - sx) * (180 / Math.PI);
        return (
          <g key={`arrow-${fromId}-${toId}`}>
            <line className="bgp-arrow-line" x1={sx} y1={sy} x2={ex} y2={ey} />
            <polygon
              className="bgp-arrow-head"
              points="-1.6,-1.2 2,0 -1.6,1.2"
              transform={`translate(${ex},${ey}) rotate(${angle})`}
            />
            {!reducedMotion && (
              <motion.circle
                className="bgp-arrow-dot"
                r={1.3}
                initial={{ cx: sx, cy: sy, opacity: 0 }}
                animate={{ cx: [sx, mx, ex], cy: [sy, my, ey], opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.3 + i * 0.2 }}
              />
            )}
          </g>
        );
      })}

      {/* Traffic dot travelling along the active path */}
      {showDot && (
        <motion.circle
          key={activePath.join('-')}
          className="bgp-traffic"
          r={1.7}
          initial={{ cx: pathPts[0].x, cy: pathPts[0].y }}
          animate={{ cx: pathPts.map((p) => p.x), cy: pathPts.map((p) => p.y) }}
          transition={{ duration: Math.max(1.2, (pathPts.length - 1) * 0.8), ease: 'linear', repeat: Infinity, repeatDelay: 0.2 }}
        />
      )}

      {/* Nodes */}
      {AS_NODES.map((n) => {
        const above = n.y > 38; // place labels above for the lower nodes
        const ly = above ? n.y - 6.2 : n.y + 8.4;
        const cls = [
          'bgp-node',
          `is-${n.role}`,
          learnedSet.has(n.id) ? 'is-learned' : '',
          onActivePath.has(n.id) ? 'is-onpath' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <g key={n.id} className={cls}>
            <circle className="bgp-node__dot" cx={n.x} cy={n.y} r={4.4} />
            <text className="bgp-node__asn" x={n.x} y={ly} textAnchor="middle">
              {n.asn}
            </text>
            <text className="bgp-node__name" x={n.x} y={ly + 3.4} textAnchor="middle">
              {n.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
