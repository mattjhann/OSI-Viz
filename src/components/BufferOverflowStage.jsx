import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BOF_STEPS } from '../data/bufferOverflow.js';
import CodeBlock from './CodeBlock.jsx';
import MemoryGrid from './MemoryGrid.jsx';
import FieldDetail from './FieldDetail.jsx';
import StepRail from './StepRail.jsx';

const N = BOF_STEPS.length;

const RAIL_ITEMS = BOF_STEPS.map((s) => ({
  id: s.id,
  label: s.title,
  sublabel: s.cells.find((c) => c.id === 's1')?.state === 'attacker' ? 'hijacked' : s.cells.find((c) => c.id === 's4')?.state,
  accentColor: s.accentColor,
}));

export default function BufferOverflowStage({ activeIndex, onSelectStep }) {
  const reducedMotion = useReducedMotion();
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    setHoveredField(null);
  }, [activeIndex]);

  const step = BOF_STEPS[activeIndex];

  return (
    <div className="encap-stage" aria-label="Stack buffer overflow walkthrough">
      <StepRail items={RAIL_ITEMS} activeIndex={activeIndex} label="Stack timeline" onSelect={onSelectStep} />

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
                <span className="caption__layernum">Stack</span>
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
              className="mem-stage mem-stage--split"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.35, ease: 'easeOut' }}
            >
              <CodeBlock
                lines={step.code}
                accentColor={step.accentColor}
                hoveredField={hoveredField}
                onInspect={setHoveredField}
                reducedMotion={reducedMotion}
                ariaLabel="Code executing this step"
              />
              <MemoryGrid
                cells={step.cells}
                layout="column"
                accentColor={step.accentColor}
                hoveredField={hoveredField}
                onInspect={setHoveredField}
                reducedMotion={reducedMotion}
                ariaLabel="Stack frame layout"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <FieldDetail
          field={hoveredField}
          prompt="Hover or tab through a highlighted line or cell above to learn what it does."
          accentColor={step.accentColor}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
