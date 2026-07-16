import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { UAF_STEPS } from '../data/useAfterFree.js';
import CodeBlock from './CodeBlock.jsx';
import MemoryGrid from './MemoryGrid.jsx';
import FieldDetail from './FieldDetail.jsx';
import StepRail from './StepRail.jsx';

const N = UAF_STEPS.length;

const RAIL_ITEMS = UAF_STEPS.map((s) => ({
  id: s.id,
  label: s.title,
  sublabel: s.cells.find((c) => c.id === 'h2')?.state,
  accentColor: s.accentColor,
}));

export default function UafStage({ activeIndex, onSelectStep }) {
  const reducedMotion = useReducedMotion();
  const [hoveredField, setHoveredField] = useState(null);

  useEffect(() => {
    setHoveredField(null);
  }, [activeIndex]);

  const step = UAF_STEPS[activeIndex];
  const ptr = step.activePointer;

  return (
    <div className="encap-stage" aria-label="Use-after-free walkthrough">
      <StepRail items={RAIL_ITEMS} activeIndex={activeIndex} label="Heap timeline" onSelect={onSelectStep} />

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
                <span className="caption__layernum">Heap</span>
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
              className="mem-stage"
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
              {ptr && (
                <div className={`mem-pointer ${ptr.dangling ? 'is-dangling' : ''} ${ptr.firing ? 'is-firing' : ''}`}>
                  <span className="mem-pointer__label">{ptr.label}</span>
                  {ptr.target ? <span className="mem-pointer__arrow">→</span> : <span className="mem-pointer__arrow">✕</span>}
                </div>
              )}
              <MemoryGrid
                cells={step.cells}
                layout="row"
                accentColor={step.accentColor}
                hoveredField={hoveredField}
                onInspect={setHoveredField}
                reducedMotion={reducedMotion}
                ariaLabel="Heap memory layout"
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
