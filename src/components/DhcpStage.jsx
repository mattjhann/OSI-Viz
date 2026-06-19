import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DHCP_STEPS, ACTORS } from '../data/dhcp.js';
import PacketBlock from './PacketBlock.jsx';
import FieldDetail from './FieldDetail.jsx';
import StepRail from './StepRail.jsx';

const N = DHCP_STEPS.length;
const actorIndex = (id) => ACTORS.findIndex((a) => a.id === id);

const PHASE_LABELS = { D: 'Discover', O: 'Offer', R: 'Request', A: 'Ack', done: 'Bound' };

const RAIL_ITEMS = DHCP_STEPS.map((s) => ({
  id: s.id,
  label: s.title,
  sublabel:
    s.from === s.to
      ? 'Configuration applied'
      : `${ACTORS[actorIndex(s.from)].label} → ${ACTORS[actorIndex(s.to)].label}`,
  accentColor: s.accentColor,
}));

const makeField = (step, f) => ({
  id: `${step.id}-${f.name}`,
  name: f.name,
  exampleValue: f.exampleValue,
  detail: f.detail,
  accentColor: step.accentColor,
  protocol: 'DHCP',
  kind: step.broadcast ? 'broadcast' : step.phase === 'done' ? 'config' : 'unicast',
});

export default function DhcpStage({ activeIndex, onSelectStep }) {
  const reducedMotion = useReducedMotion();
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    setHoveredField(null);
  }, [activeIndex]);

  const step = DHCP_STEPS[activeIndex];
  const fromIdx = actorIndex(step.from);
  const toIdx = actorIndex(step.to);
  const isSelfStep = step.from === step.to;
  const goingRight = toIdx >= fromIdx;

  return (
    <div className="encap-stage" aria-label="DHCP lease walkthrough">
      <StepRail items={RAIL_ITEMS} activeIndex={activeIndex} label="DORA progress" onSelect={onSelectStep} />

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
                  {isSelfStep
                    ? 'Configuration applied'
                    : `${ACTORS[fromIdx].label} → ${ACTORS[toIdx].label}`}
                </span>
              </div>
              <h2 className="caption__title">
                {step.title}
                <span className="caption__protocol">
                  {step.broadcast ? 'broadcast' : step.phase === 'done' ? 'bound' : 'unicast'}
                </span>
              </h2>
              <p className="caption__desc">{step.summary}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* DORA phase indicator */}
        <div className="dhcp-dora" role="img" aria-label={`Phase: ${PHASE_LABELS[step.phase]}`}>
          {['D', 'O', 'R', 'A'].map((letter) => (
            <div
              key={letter}
              className={`dhcp-dora__step${step.phase === letter ? ' is-active' : ''}${
                'DORA'.indexOf(letter) < 'DORA'.indexOf(step.phase) ? ' is-done' : ''
              }`}
              style={step.phase === letter ? { '--block-accent': step.accentColor } : undefined}
            >
              <span className="dhcp-dora__letter">{letter}</span>
              <span className="dhcp-dora__label">{PHASE_LABELS[letter]}</span>
            </div>
          ))}
        </div>

        {/* LAN participants */}
        <div
          className="dhcp-lan"
          style={{ '--block-accent': step.accentColor }}
          role="img"
          aria-label={
            isSelfStep
              ? 'Client is now configured'
              : `${ACTORS[fromIdx].label} to ${ACTORS[toIdx].label}${step.broadcast ? ' (broadcast)' : ''}`
          }
        >
          {ACTORS.map((actor, i) => {
            const isFrom = i === fromIdx;
            const isTo = i === toIdx;
            const role = isSelfStep && isFrom ? 'self' : isFrom ? 'from' : isTo ? 'to' : 'idle';
            return (
              <div key={actor.id} className={`dhcp-actor is-${role}`}>
                <span className="dhcp-actor__icon" aria-hidden="true">
                  {actor.id === 'client' && (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="12" rx="2" />
                      <path d="M7 20h10M12 16v4" />
                    </svg>
                  )}
                  {actor.id === 'switch' && (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="8" width="20" height="8" rx="2" />
                      <circle cx="7" cy="12" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="17" cy="12" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                  )}
                  {actor.id === 'server' && (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="4" y="2" width="16" height="7" rx="1.5" />
                      <rect x="4" y="11" width="16" height="7" rx="1.5" />
                      <circle cx="16" cy="5.5" r="1" fill="currentColor" stroke="none" />
                      <circle cx="16" cy="14.5" r="1" fill="currentColor" stroke="none" />
                      <path d="M8 21h8M12 18v3" />
                    </svg>
                  )}
                </span>
                <span className="dhcp-actor__label">{actor.label}</span>
                <span className="dhcp-actor__sub">{actor.sublabel}</span>
              </div>
            );
          })}

          {/* Broadcast / unicast wave animation */}
          {!isSelfStep && (
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                className={`dhcp-wave ${goingRight ? 'is-right' : 'is-left'}${step.broadcast ? ' is-broadcast' : ''}`}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                transition={{ duration: reducedMotion ? 0.2 : 0.5, ease: 'easeOut' }}
              >
                <span className="dhcp-wave__arrow" aria-hidden="true">
                  {goingRight ? '▶' : '◀'}
                </span>
                {step.broadcast && (
                  <span className="dhcp-wave__tag">broadcast</span>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Message fields */}
        <div className="dns-msg-wrap">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className="dns-msg"
              style={{ '--block-accent': step.accentColor }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: goingRight ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: goingRight ? 40 : -40 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.4, ease: 'easeOut' }}
            >
              <div className="dns-msg__head">
                <span className="dns-msg__title">
                  {step.phase === 'done' ? 'Applied configuration' : step.title}
                </span>
              </div>
              <div className="dns-msg__fields">
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
        </div>

        <FieldDetail
          field={hoveredField}
          prompt="Hover or tab through a field above to learn what it carries."
          accentColor={step.accentColor}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
