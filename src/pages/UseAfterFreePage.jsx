import { motion, useReducedMotion } from 'framer-motion';
import ScrollDeck from '../components/ScrollDeck.jsx';
import UafStage from '../components/UafStage.jsx';
import { UAF_STEPS } from '../data/useAfterFree.js';

export default function UseAfterFreePage() {
  const reducedMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  });

  const hero = (
    <header className="hero">
      <motion.p className="hero__kicker" {...rise(0)}>
        CWE-416 · A dangling pointer meets a reused address
      </motion.p>
      <motion.h1 className="hero__title" {...rise(0.12)}>
        Use-<span className="hero__title-accent">After</span>-Free
      </motion.h1>
      <motion.p className="hero__lede" {...rise(0.24)}>
        Freeing memory doesn't erase every pointer to it. Watch a heap slot get allocated, freed
        while a stale reference survives, reused by attacker-controlled data — and finally
        dereferenced again, handing control flow to whatever the attacker put there.
      </motion.p>
    </header>
  );

  const footer = (
    <footer className="footer">
      <p className="footer__recap">
        The bug isn't the free — it's the second reference nobody accounted for. Ownership types
        (shared_ptr/unique_ptr), nulling pointers after free, and hardened allocators that
        quarantine freed memory all attack the same root cause: ambiguous object lifetime.
      </p>
      <p className="footer__credit">NetViz · Use-After-Free</p>
    </footer>
  );

  return (
    <ScrollDeck
      stepCount={UAF_STEPS.length}
      hero={hero}
      footer={footer}
      renderStage={(activeIndex, onSelectStep) => (
        <UafStage activeIndex={activeIndex} onSelectStep={onSelectStep} />
      )}
    />
  );
}
