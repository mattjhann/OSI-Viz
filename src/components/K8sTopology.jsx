import { motion } from 'framer-motion';
import { K8S_NODES, K8S_PODS, K8S_ACTORS } from '../data/kubernetes.js';

// Center points for everything a path can travel through.
const CENTERS = {
  ...Object.fromEntries(K8S_ACTORS.map((a) => [a.id, { x: a.x, y: a.y }])),
  ...Object.fromEntries(K8S_PODS.map((p) => [p.id, { x: p.x, y: p.y }])),
};

const POD_W = 16;
const POD_H = 9;

export default function K8sTopology({
  hiddenPods = [],
  deadPods = [],
  activePods = [],
  showService = false,
  showIngress = false,
  selector = [],
  path = [],
  flow = false,
  accentColor,
  reducedMotion = false,
}) {
  const hidden = new Set(hiddenPods);
  const dead = new Set(deadPods);
  const active = new Set(activePods);

  const pathPts = path.map((id) => CENTERS[id]).filter(Boolean);
  const showDot = flow && !reducedMotion && pathPts.length >= 2;
  const svcActor = K8S_ACTORS.find((a) => a.id === 'svc');

  return (
    <svg
      className="k8s-topology"
      viewBox="0 0 100 60"
      role="img"
      aria-label="Kubernetes cluster topology"
      style={{ '--block-accent': accentColor }}
    >
      {/* Cluster boundary */}
      <rect className="k8s-cluster" x="20" y="1" width="79" height="58" rx="2.5" />
      <text className="k8s-cluster__label" x="23" y="5.4">cluster</text>

      {/* Selector links (service → matching pods), under everything else */}
      {showService &&
        selector.map((podId) => {
          const p = CENTERS[podId];
          return (
            <line
              key={`sel-${podId}`}
              className="k8s-selector"
              x1={svcActor.x}
              y1={svcActor.y}
              x2={p.x}
              y2={p.y}
            />
          );
        })}

      {/* Active path segments */}
      {pathPts.slice(0, -1).map((a, i) => {
        const b = pathPts[i + 1];
        return <line key={`path-${i}`} className="k8s-path" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
      })}

      {/* Worker nodes */}
      {K8S_NODES.map((n) => (
        <g key={n.id} className="k8s-node">
          <rect className="k8s-node__box" x={n.x} y={n.y} width={n.w} height={n.h} rx="1.8" />
          <text className="k8s-node__label" x={n.x + 2} y={n.y + 3.6}>
            {n.label} · {n.sublabel}
          </text>
        </g>
      ))}

      {/* Pods */}
      {K8S_PODS.filter((p) => !hidden.has(p.id)).map((p) => {
        const cls = [
          'k8s-pod',
          dead.has(p.id) ? 'is-dead' : '',
          active.has(p.id) ? 'is-active' : '',
          p.id === 'dns' ? 'is-system' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <g key={p.id} className={cls}>
            <rect
              className="k8s-pod__box"
              x={p.x - POD_W / 2}
              y={p.y - POD_H / 2}
              width={POD_W}
              height={POD_H}
              rx="1.4"
            />
            <text className="k8s-pod__name" x={p.x} y={p.y - 0.6} textAnchor="middle">
              {p.label}
            </text>
            <text className="k8s-pod__ip" x={p.x} y={p.y + 2.8} textAnchor="middle">
              {dead.has(p.id) ? '✕ terminated' : p.ip}
            </text>
          </g>
        );
      })}

      {/* Service — a virtual address, so it gets a dashed pill */}
      {showService && (
        <g className="k8s-svc">
          <rect
            className="k8s-svc__box"
            x={svcActor.x - 9}
            y={svcActor.y - 5.5}
            width={18}
            height={11}
            rx="5.5"
          />
          <text className="k8s-svc__name" x={svcActor.x} y={svcActor.y - 0.6} textAnchor="middle">
            web
          </text>
          <text className="k8s-svc__ip" x={svcActor.x} y={svcActor.y + 3} textAnchor="middle">
            {svcActor.sublabel}
          </text>
        </g>
      )}

      {/* Ingress controller and external client */}
      {showIngress && (
        <>
          <g className="k8s-actor">
            <circle className="k8s-actor__dot" cx={CENTERS.ingress.x} cy={CENTERS.ingress.y} r="4.4" />
            <text className="k8s-actor__label" x={CENTERS.ingress.x} y={CENTERS.ingress.y + 8.4} textAnchor="middle">
              Ingress
            </text>
          </g>
          <g className="k8s-actor">
            <circle className="k8s-actor__dot" cx={CENTERS.client.x} cy={CENTERS.client.y} r="4.4" />
            <text className="k8s-actor__label" x={CENTERS.client.x} y={CENTERS.client.y + 8.4} textAnchor="middle">
              Client
            </text>
          </g>
        </>
      )}

      {/* Request dot travelling along the active path */}
      {showDot && (
        <motion.circle
          key={path.join('-')}
          className="k8s-traffic"
          r={1.7}
          initial={{ cx: pathPts[0].x, cy: pathPts[0].y }}
          animate={{ cx: pathPts.map((p) => p.x), cy: pathPts.map((p) => p.y) }}
          transition={{
            duration: Math.max(1.2, (pathPts.length - 1) * 0.8),
            ease: 'linear',
            repeat: Infinity,
            repeatDelay: 0.2,
          }}
        />
      )}
    </svg>
  );
}
