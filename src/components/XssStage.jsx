import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { XSS_STEPS } from '../data/xss.js';
import CodeBlock from './CodeBlock.jsx';
import FieldDetail from './FieldDetail.jsx';
import StepRail from './StepRail.jsx';

const N = XSS_STEPS.length;

const RAIL_ITEMS = XSS_STEPS.map((s) => ({
  id: s.id,
  label: s.title,
  sublabel: s.category,
  accentColor: s.accentColor,
}));

export default function XssStage({ activeIndex, onSelectStep }) {
  const reducedMotion = useReducedMotion();
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    setHoveredField(null);
  }, [activeIndex]);

  const step = XSS_STEPS[activeIndex];

  return (
    <div className="encap-stage" aria-label="Cross-site scripting walkthrough">
      <StepRail items={RAIL_ITEMS} activeIndex={activeIndex} label="XSS progress" onSelect={onSelectStep} />

      <div className="encap-stage__inner">
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
                <span className="caption__layernum">{step.category}</span>
              </div>
              <h2 className="caption__title">{step.title}</h2>
              <p className="caption__desc">{step.summary}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="code-stage-graph">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className="code-panels"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.35, ease: 'easeOut' }}
            >
              {step.panels.map((panel) => (
                <CodeBlock
                  key={panel.title}
                  title={panel.title}
                  lines={panel.lines}
                  accentColor={step.accentColor}
                  hoveredField={hoveredField}
                  onInspect={setHoveredField}
                  reducedMotion={reducedMotion}
                  ariaLabel={panel.title}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <FieldDetail
          field={hoveredField}
          prompt="Hover or tab through a highlighted line above to learn what it does."
          accentColor={step.accentColor}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
