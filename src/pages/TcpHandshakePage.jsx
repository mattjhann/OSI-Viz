import { motion, useReducedMotion } from 'framer-motion';
import ScrollDeck from '../components/ScrollDeck.jsx';
import TcpStage from '../components/TcpStage.jsx';
import { TCP_STEPS } from '../data/tcpHandshake.js';

export default function TcpHandshakePage() {
  const reducedMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  });

  const hero = (
    <header className="hero">
      <motion.p className="hero__kicker" {...rise(0)}>
        TCP · A connection from SYN to TIME-WAIT
      </motion.p>
      <motion.h1 className="hero__title" {...rise(0.12)}>
        <span className="hero__title-accent">TCP</span> Connection
      </motion.h1>
      <motion.p className="hero__lede" {...rise(0.24)}>
        Beneath almost everything on the Internet sits a TCP connection. Walk through its whole
        life — the three-way handshake, how sequence and acknowledgement numbers turn loose
        packets into a reliable byte stream, and the orderly FIN teardown.
      </motion.p>
    </header>
  );

  const footer = (
    <footer className="footer">
      <p className="footer__recap">
        Three segments to open, byte-counting to stay reliable, four to close — and a
        TIME-WAIT pause so stragglers die out. That simple contract is what TLS, HTTP,
        and most of the protocols in this collection quietly stand on.
      </p>
      <p className="footer__credit">NetViz · TCP connection</p>
    </footer>
  );

  return (
    <ScrollDeck
      stepCount={TCP_STEPS.length}
      hero={hero}
      footer={footer}
      renderStage={(activeIndex, onSelectStep) => (
        <TcpStage activeIndex={activeIndex} onSelectStep={onSelectStep} />
      )}
    />
  );
}
