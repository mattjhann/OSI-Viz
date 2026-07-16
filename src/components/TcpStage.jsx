import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { TCP_STEPS } from '../data/tcpHandshake.js';
import PacketBlock from './PacketBlock.jsx';
import FieldDetail from './FieldDetail.jsx';
import StepRail from './StepRail.jsx';

const N = TCP_STEPS.length;

// How far (px) a segment slides toward the destination lane as it is "sent".
// Same treatment as the TLS flow (read at module load; CSR only).
const SEND_DISTANCE =
  typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.42, 560) : 480;

const RAIL_ITEMS = TCP_STEPS.map((s) => ({
  id: s.id,
  label: s.title,
  sublabel: s.from === 'client' ? 'Client → Server' : 'Server → Client',
  accentColor: s.accentColor,
}));

const makeField = (step, f) => ({
  id: `${step.id}-${f.name}`,
  name: f.name,
  exampleValue: f.exampleValue,
  detail: f.detail,
  accentColor: step.accentColor,
  protocol: 'TCP',
  kind: 'segment',
});

export default function TcpStage({ activeIndex, onSelectStep }) {
  const reducedMotion = useReducedMotion();
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    setHoveredField(null);
  }, [activeIndex]);

  const step = TCP_STEPS[activeIndex];
  const fromClient = step.from === 'client';
  const dir = fromClient ? -1 : 1; // sign of the sender's lane (client = left)

  const message = (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        className="tls-msg"
        style={{ gridColumn: fromClient ? 1 : 3, '--block-accent': step.accentColor }}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: dir * 48 }}
        animate={{ opacity: 1, x: 0 }}
        exit={
          reducedMotion
            ? { opacity: 0 }
            : {
                opacity: 0,
                x: -dir * SEND_DISTANCE,
                transition: { duration: 0.55, ease: 'easeIn' },
              }
        }
        transition={{ duration: reducedMotion ? 0.2 : 0.4, ease: 'easeOut' }}
      >
        <div className="tls-msg__head">
          <span className="tls-msg__title">{step.title}</span>
        </div>
        <div className="tls-msg__fields">
          {step.fields.map((f) => {
            const field = makeField(step, f);
            return (
              <PacketBlock
                key={field.id}
                variant="header"
                interactive
                highlighted
                accentColor={step.accentColor}
                label={f.name}
                value={f.exampleValue}
                field={field}
                isHovered={hoveredField?.id === field.id}
                onInspect={setHoveredField}
                reducedMotion={reducedMotion}
              />
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="encap-stage" aria-label="TCP connection walkthrough">
      <StepRail items={RAIL_ITEMS} activeIndex={activeIndex} label="Connection progress" onSelect={onSelectStep} />

      <div className="encap-stage__inner">
        {/* Caption */}
        <div className="caption">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className="caption__inner"
              style={{ '--block-accent': step.accentColor }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.35, ease: 'easeOut' }}
            >
              <div className="caption__eyebrow">
                <span className="caption__step">Step {activeIndex + 1} / {N}</span>
                <span className="caption__layernum">
                  {fromClient ? 'Client → Server' : 'Server → Client'}
                </span>
              </div>
              <h2 className="caption__title">{step.title}</h2>
              <p className="caption__desc">{step.summary}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Per-side TCP connection states after this step */}
        <div className="tcp-states" role="img" aria-label={`Client state ${step.states.client}, server state ${step.states.server}`}>
          {['client', 'server'].map((side) => (
            <div key={side} className="tcp-states__side" style={{ '--block-accent': step.accentColor }}>
              <span className="tcp-states__who">{side}</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${side}-${step.states[side]}`}
                  className="tcp-states__state"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: reducedMotion ? 0.15 : 0.3, ease: 'easeOut' }}
                >
                  {step.states[side]}
                </motion.span>
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Two-lane segment flow (same layout as the TLS handshake) */}
        <div className="tls-flow">
          <div className="tls-flow__lanes">
            <span className="tls-lane-tag tls-lane-tag--client">Client</span>
            <span className="tls-lane-tag tls-lane-tag--server">Server</span>
          </div>
          <div
            className="tls-flow__zone"
            role="img"
            aria-label={`${step.title}, ${fromClient ? 'client to server' : 'server to client'}`}
          >
            {message}
            <div className={`tls-arrow ${fromClient ? 'is-right' : 'is-left'}`} aria-hidden="true">
              <span className="tls-arrow__glyph">{fromClient ? '▶' : '◀'}</span>
            </div>
          </div>
        </div>

        <FieldDetail
          field={hoveredField}
          prompt="Hover or tab through a field above to learn what it does."
          accentColor={step.accentColor}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
