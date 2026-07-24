import { motion, useReducedMotion } from 'framer-motion';
import ScrollDeck from '../components/ScrollDeck.jsx';
import K8sServiceTypesStage from '../components/K8sServiceTypesStage.jsx';
import { K8S_SVC_STEPS } from '../data/k8sServiceTypes.js';

export default function K8sServiceTypesPage() {
  const reducedMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  });

  const hero = (
    <header className="hero">
      <motion.p className="hero__kicker" {...rise(0)}>
        Kubernetes · Getting traffic in from outside
      </motion.p>
      <motion.h1 className="hero__title" {...rise(0.12)}>
        Kubernetes <span className="hero__title-accent">Service Types</span>
      </motion.h1>
      <motion.p className="hero__lede" {...rise(0.24)}>
        ClusterIP, NodePort, and LoadBalancer aren&apos;t three separate mechanisms — each one wraps
        the last. Follow a request as it works its way in from the public internet, layer by layer,
        down to a Pod.
      </motion.p>
    </header>
  );

  const footer = (
    <footer className="footer">
      <p className="footer__recap">
        LoadBalancer sits on NodePort, NodePort sits on ClusterIP — every Service has that last
        layer whether or not it's ever exposed further. And once traffic reaches any node, kube-proxy
        can send it to any healthy Pod in the cluster, not just one running locally.
      </p>
      <p className="footer__credit">NetViz · Kubernetes Service types</p>
    </footer>
  );

  return (
    <ScrollDeck
      stepCount={K8S_SVC_STEPS.length}
      hero={hero}
      footer={footer}
      renderStage={(activeIndex, onSelectStep) => (
        <K8sServiceTypesStage activeIndex={activeIndex} onSelectStep={onSelectStep} />
      )}
    />
  );
}
