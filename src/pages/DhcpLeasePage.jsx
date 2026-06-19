import { motion, useReducedMotion } from 'framer-motion';
import ScrollDeck from '../components/ScrollDeck.jsx';
import DhcpStage from '../components/DhcpStage.jsx';
import { DHCP_STEPS } from '../data/dhcp.js';

export default function DhcpLeasePage() {
  const reducedMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  });

  const hero = (
    <header className="hero">
      <motion.p className="hero__kicker" {...rise(0)}>
        DHCP · Getting an address on the network
      </motion.p>
      <motion.h1 className="hero__title" {...rise(0.12)}>
        <span className="hero__title-accent">DHCP</span> Lease
      </motion.h1>
      <motion.p className="hero__lede" {...rise(0.24)}>
        When a device joins a network, it has no IP address. The DHCP handshake — Discover, Offer,
        Request, Acknowledge — assigns one in four broadcast messages. Step through each and hover
        any field to see what it carries.
      </motion.p>
    </header>
  );

  const footer = (
    <footer className="footer">
      <p className="footer__recap">
        Four messages and the device has an IP address, a gateway, and DNS servers — ready
        to talk to the world. When the lease runs low, a simple renewal keeps things going
        without starting over.
      </p>
      <p className="footer__credit">NetViz · DHCP lease</p>
    </footer>
  );

  return (
    <ScrollDeck
      stepCount={DHCP_STEPS.length}
      hero={hero}
      footer={footer}
      renderStage={(activeIndex, onSelectStep) => (
        <DhcpStage activeIndex={activeIndex} onSelectStep={onSelectStep} />
      )}
    />
  );
}
