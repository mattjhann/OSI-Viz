import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MULTICAST_VPN_STEPS } from '../data/multicastVpn.js';
import PacketBlock from './PacketBlock.jsx';
import FieldDetail from './FieldDetail.jsx';
import StepRail from './StepRail.jsx';
import McastTopology from './McastTopology.jsx';

const N = MULTICAST_VPN_STEPS.length;

const RAIL_ITEMS = MULTICAST_VPN_STEPS.map((s) => ({
  id: s.id,
  label: s.title,
  accentColor: s.accentColor,
}));

const makeField = (step, f) => ({
  id: `${step.id}-${f.name}`,
  name: f.name,
  exampleValue: f.exampleValue,
  detail: f.detail,
  accentColor: step.accentColor,
  protocol: 'Multicast/VPN',
  kind: step.verdict,
});

export default function MulticastVpnStage({ activeIndex, onSelectStep }) {
  const reducedMotion = useReducedMotion();
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    setHoveredField(null);
  }, [activeIndex]);

  const step = MULTICAST_VPN_STEPS[activeIndex];

  return (
    <div className="encap-stage" aria-label="Multicast over VPN tunnels walkthrough">
      <StepRail items={RAIL_ITEMS} activeIndex={activeIndex} label="Comparison progress" onSelect={onSelectStep} />

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
                <span className="caption__layernum">Tunnel design</span>
              </div>
              <h2 className="caption__title">
                {step.title}
                <span className={`caption__protocol mcast-verdict mcast-verdict--${step.verdict}`}>
                  {step.verdictLabel}
                </span>
              </h2>
              <p className="caption__desc">{step.summary}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Topology diagram */}
        <div className="bgp-stage-graph">
          <McastTopology {...step.topology} accentColor={step.accentColor} reducedMotion={reducedMotion} />
        </div>

        {/* Field detail cards */}
        <div className="dns-msg-wrap">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className="dns-msg"
              style={{ '--block-accent': step.accentColor }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.4, ease: 'easeOut' }}
            >
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
          prompt="Hover or tab through a field above to learn what it does."
          accentColor={step.accentColor}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
