import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BGP_STEPS } from '../data/bgpRouting.js';
import PacketBlock from './PacketBlock.jsx';
import FieldDetail from './FieldDetail.jsx';
import StepRail from './StepRail.jsx';
import BgpTopology from './BgpTopology.jsx';

const N = BGP_STEPS.length;

const RAIL_ITEMS = BGP_STEPS.map((s) => ({
  id: s.id,
  label: s.title,
  sublabel: s.message ? `BGP ${s.message.type}` : 'topology',
  accentColor: s.accentColor,
}));

const makeField = (step, f) => ({
  id: `${step.id}-${f.name}`,
  name: f.name,
  exampleValue: f.exampleValue,
  detail: f.detail,
  accentColor: step.accentColor,
  protocol: 'BGP',
  kind: step.message?.type ?? 'UPDATE',
});

export default function BgpStage({ activeIndex, onSelectStep }) {
  const reducedMotion = useReducedMotion();
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    setHoveredField(null);
  }, [activeIndex]);

  const step = BGP_STEPS[activeIndex];

  return (
    <div className="encap-stage" aria-label="BGP routing walkthrough">
        <StepRail items={RAIL_ITEMS} activeIndex={activeIndex} label="Routing progress" onSelect={onSelectStep} />

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
                  <span className="caption__layernum">eBGP</span>
                </div>
                <h2 className="caption__title">{step.title}</h2>
                <p className="caption__desc">{step.summary}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Topology graph */}
          <div className="bgp-stage-graph">
            <BgpTopology {...step.topology} accentColor={step.accentColor} reducedMotion={reducedMotion} />
            <div className="bgp-legend" aria-hidden="true">
              <span className="bgp-legend__item bgp-legend__item--active">active path</span>
              <span className="bgp-legend__item bgp-legend__item--down">link down</span>
            </div>
          </div>

          {/* BGP message (when the step has one) */}
          <div className="bgp-msg-wrap">
            <AnimatePresence mode="wait">
              {step.message ? (
                <motion.div
                  key={step.id}
                  className="bgp-msg"
                  style={{ '--block-accent': step.accentColor }}
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: reducedMotion ? 0.2 : 0.35, ease: 'easeOut' }}
                >
                  <span className={`bgp-msg__tag ${step.message.type === 'WITHDRAW' ? 'is-withdraw' : ''}`}>
                    BGP {step.message.type}
                  </span>
                  <div className="bgp-msg__fields">
                    {step.message.fields.map((f) => {
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
              ) : (
                <motion.p
                  key={`${step.id}-nomsg`}
                  className="bgp-msg-note"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  No BGP message this step — watch the topology.
                </motion.p>
              )}
            </AnimatePresence>
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
