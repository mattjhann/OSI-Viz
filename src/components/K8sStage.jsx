import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { K8S_STEPS } from '../data/kubernetes.js';
import PacketBlock from './PacketBlock.jsx';
import FieldDetail from './FieldDetail.jsx';
import StepRail from './StepRail.jsx';
import K8sTopology from './K8sTopology.jsx';

const N = K8S_STEPS.length;

const RAIL_ITEMS = K8S_STEPS.map((s) => ({
  id: s.id,
  label: s.title,
  sublabel: s.message?.tag,
  accentColor: s.accentColor,
}));

const makeField = (step, f) => ({
  id: `${step.id}-${f.name}`,
  name: f.name,
  exampleValue: f.exampleValue,
  detail: f.detail,
  accentColor: step.accentColor,
  protocol: 'K8s',
  kind: step.message?.tag ?? '',
});

export default function K8sStage({ activeIndex, onSelectStep }) {
  const reducedMotion = useReducedMotion();
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    setHoveredField(null);
  }, [activeIndex]);

  const step = K8S_STEPS[activeIndex];

  return (
    <div className="encap-stage" aria-label="Kubernetes networking walkthrough">
      <StepRail items={RAIL_ITEMS} activeIndex={activeIndex} label="Cluster progress" onSelect={onSelectStep} />

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
                <span className="caption__layernum">Kubernetes</span>
              </div>
              <h2 className="caption__title">{step.title}</h2>
              <p className="caption__desc">{step.summary}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Cluster topology */}
        <div className="k8s-stage-graph">
          <K8sTopology {...step.topology} accentColor={step.accentColor} reducedMotion={reducedMotion} />
        </div>

        {/* Detail card (when the step has one) */}
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
                <span className="bgp-msg__tag">{step.message.tag}</span>
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
                Watch the request travel: client → ingress → service → pod.
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
