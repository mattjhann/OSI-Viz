import { motion, useReducedMotion } from 'framer-motion';
import ScrollDeck from '../components/ScrollDeck.jsx';
import XssStage from '../components/XssStage.jsx';
import { XSS_STEPS } from '../data/xss.js';

export default function XssPage() {
  const reducedMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  });

  const hero = (
    <header className="hero">
      <motion.p className="hero__kicker" {...rise(0)}>
        CWE-79 · When untrusted input becomes executable markup
      </motion.p>
      <motion.h1 className="hero__title" {...rise(0.12)}>
        Cross-Site <span className="hero__title-accent">Scripting</span>
      </motion.h1>
      <motion.p className="hero__lede" {...rise(0.24)}>
        Reflected, stored, and DOM-based XSS all share one root cause: a page renders untrusted
        text as if it were trusted markup. Step through a real payload for each variant, watch it
        execute in the victim's own browser origin, then see how output encoding closes the gap.
      </motion.p>
    </header>
  );

  const footer = (
    <footer className="footer">
      <p className="footer__recap">
        Every variant boils down to the same fix: never let untrusted data cross into a parser —
        HTML, in this case — without encoding it for that context first. Escape on output, prefer
        textContent over innerHTML, and layer CSP and HttpOnly cookies underneath as a safety net.
      </p>
      <p className="footer__credit">NetViz · Cross-Site Scripting</p>
    </footer>
  );

  return (
    <ScrollDeck
      stepCount={XSS_STEPS.length}
      hero={hero}
      footer={footer}
      renderStage={(activeIndex, onSelectStep) => (
        <XssStage activeIndex={activeIndex} onSelectStep={onSelectStep} />
      )}
    />
  );
}
