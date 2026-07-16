import { motion, useReducedMotion } from 'framer-motion';
import ScrollDeck from '../components/ScrollDeck.jsx';
import K8sStage from '../components/K8sStage.jsx';
import { K8S_STEPS } from '../data/kubernetes.js';

export default function KubernetesPage() {
  const reducedMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  });

  const hero = (
    <header className="hero">
      <motion.p className="hero__kicker" {...rise(0)}>
        Kubernetes · How a request reaches a Pod
      </motion.p>
      <motion.h1 className="hero__title" {...rise(0.12)}>
        <span className="hero__title-accent">Kubernetes</span> Networking
      </motion.h1>
      <motion.p className="hero__lede" {...rise(0.24)}>
        Pods come and go, yet requests keep landing. Follow the path — Pod IPs, Services,
        cluster DNS, kube-proxy&apos;s packet rewriting, and Ingress — to see how Kubernetes
        turns disposable Pods into a stable, reachable application.
      </motion.p>
    </header>
  );

  const footer = (
    <footer className="footer">
      <p className="footer__recap">
        Every layer exists to absorb churn: the CNI gives Pods real IPs, the Service pins a
        stable virtual one on top, DNS names it, kube-proxy makes the virtual address actually
        work, and Ingress opens the front door. Kill any Pod and the request path heals itself.
      </p>
      <p className="footer__credit">NetViz · Kubernetes networking</p>
    </footer>
  );

  return (
    <ScrollDeck
      stepCount={K8S_STEPS.length}
      hero={hero}
      footer={footer}
      renderStage={(activeIndex, onSelectStep) => (
        <K8sStage activeIndex={activeIndex} onSelectStep={onSelectStep} />
      )}
    />
  );
}
