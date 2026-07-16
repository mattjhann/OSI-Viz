import { motion, useReducedMotion } from 'framer-motion';
import ScrollDeck from '../components/ScrollDeck.jsx';
import BufferOverflowStage from '../components/BufferOverflowStage.jsx';
import { BOF_STEPS } from '../data/bufferOverflow.js';

export default function BufferOverflowPage() {
  const reducedMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  });

  const hero = (
    <header className="hero">
      <motion.p className="hero__kicker" {...rise(0)}>
        CWE-121 · An unbounded write walks off the end of a stack buffer
      </motion.p>
      <motion.h1 className="hero__title" {...rise(0.12)}>
        Stack Buffer <span className="hero__title-accent">Overflow</span>
      </motion.h1>
      <motion.p className="hero__lede" {...rise(0.24)}>
        A fixed-size local buffer, an unbounded copy, and attacker-controlled input length. Watch
        the overflow march past the buffer, through the stack canary, over the saved frame
        pointer, and into the return address — the exact value the CPU jumps to next.
      </motion.p>
    </header>
  );

  const footer = (
    <footer className="footer">
      <p className="footer__recap">
        Bounding the copy fixes the bug outright; canaries, ASLR, and non-executable stacks are
        the layers that catch what still slips through. Modern systems stack all four — a single
        strcpy() mistake shouldn't be one hop from arbitrary code execution.
      </p>
      <p className="footer__credit">NetViz · Stack Buffer Overflow</p>
    </footer>
  );

  return (
    <ScrollDeck
      stepCount={BOF_STEPS.length}
      hero={hero}
      footer={footer}
      renderStage={(activeIndex, onSelectStep) => (
        <BufferOverflowStage activeIndex={activeIndex} onSelectStep={onSelectStep} />
      )}
    />
  );
}
