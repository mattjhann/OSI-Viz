import { motion, useReducedMotion } from 'framer-motion';
import ScrollDeck from '../components/ScrollDeck.jsx';
import MulticastVpnStage from '../components/MulticastVpnStage.jsx';
import { MULTICAST_VPN_STEPS } from '../data/multicastVpn.js';

export default function MulticastVpnPage() {
  const reducedMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  });

  const hero = (
    <header className="hero">
      <motion.p className="hero__kicker" {...rise(0)}>
        Multicast · Does it survive the tunnel?
      </motion.p>
      <motion.h1 className="hero__title" {...rise(0.12)}>
        Multicast over <span className="hero__title-accent">VPN Tunnels</span>
      </motion.h1>
      <motion.p className="hero__lede" {...rise(0.24)}>
        Multicast relies on a distribution tree that most VPN tunnels have no concept of. Compare
        five tunnel designs — policy-based and route-based IPsec, GRE-over-IPsec, and OpenVPN's
        tun and tap modes — to see which ones carry multicast, and what each one costs you to get there.
      </motion.p>
    </header>
  );

  const footer = (
    <footer className="footer">
      <p className="footer__recap">
        Only a bridged tunnel gets multicast "for free." Everything else needs a multicast
        routing daemon layered on top — and even then, a hub with many peers usually replicates
        at the hub rather than building a real tree, so it behaves more like unicast than multicast.
      </p>
      <p className="footer__credit">NetViz · multicast over VPN tunnels</p>
    </footer>
  );

  return (
    <ScrollDeck
      stepCount={MULTICAST_VPN_STEPS.length}
      hero={hero}
      footer={footer}
      renderStage={(activeIndex, onSelectStep) => (
        <MulticastVpnStage activeIndex={activeIndex} onSelectStep={onSelectStep} />
      )}
    />
  );
}
