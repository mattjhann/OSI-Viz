import EncapsulationPage from './EncapsulationPage.jsx';
import TlsHandshakePage from './TlsHandshakePage.jsx';
import DnsResolutionPage from './DnsResolutionPage.jsx';
import BgpRoutingPage from './BgpRoutingPage.jsx';
import DhcpLeasePage from './DhcpLeasePage.jsx';
import XssPage from './XssPage.jsx';
import UseAfterFreePage from './UseAfterFreePage.jsx';
import BufferOverflowPage from './BufferOverflowPage.jsx';
import TcpHandshakePage from './TcpHandshakePage.jsx';
import KubernetesPage from './KubernetesPage.jsx';

// ===========================================================================
// PAGE REGISTRY — the single place that defines every visualization.
//
// The side menu, the router, and the home-screen cards are all generated from
// this array. To add a new visualization:
//   1. Create src/pages/<Name>Page.jsx (and optionally src/data/<name>.js).
//   2. Add one entry below.
// The menu, routes, and home cards update automatically. No other wiring needed.
//
// Each entry: { id, path, title, tagline, accent, icon, Component }
// ===========================================================================

const NestedIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="2.5" />
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
    <rect x="10" y="10" width="4" height="4" rx="1" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="4" y="10.5" width="16" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

const DnsIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.7 2.4 4.2 5.7 4.2 9S14.7 18.6 12 21c-2.7-2.4-4.2-5.7-4.2-9S9.3 5.4 12 3Z" />
  </svg>
);

const RouteIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="5" cy="6" r="2.4" />
    <circle cx="19" cy="6" r="2.4" />
    <circle cx="12" cy="18" r="2.4" />
    <path d="M7.2 6H19M5 8.4 10.6 16M19 8.4 13.4 16" />
  </svg>
);

const DhcpIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 3v4M12 17v4" />
    <path d="M5 10h14" />
    <circle cx="12" cy="13.5" r="3.5" />
    <path d="M12 12v3l2-1" />
  </svg>
);

const XssIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M8 4 4 12l4 8M16 4l4 8-4 8" />
    <path d="M13 4 11 20" />
  </svg>
);

const UafIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="9" width="6" height="6" rx="1" strokeDasharray="2 2" />
    <rect x="15" y="9" width="6" height="6" rx="1" />
    <path d="M9 12h4" strokeDasharray="1.6 1.6" />
    <path d="M12.5 10.2 14 12l-1.5 1.8" />
  </svg>
);

const StackIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="5" y="3" width="14" height="4" rx="1" />
    <rect x="5" y="8" width="14" height="4" rx="1" />
    <rect x="5" y="13" width="14" height="4" rx="1" strokeDasharray="1.8 1.8" />
    <path d="M4 21h16" />
const TcpIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 8h13M17 8l-3-3M17 8l-3 3" />
    <path d="M20 16H7M7 16l3-3M7 16l3 3" />
  </svg>
);

const K8sIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 5.5v3.3M17.8 8.9l-2.9 1.7M17.8 15.1l-2.9-1.7M12 18.5v-3.3M6.2 15.1l2.9-1.7M6.2 8.9l2.9 1.7" />
  </svg>
);

export const PAGES = [
  {
    id: 'encapsulation',
    path: '/encapsulation',
    title: 'Network Encapsulation',
    tagline: 'Watch data get wrapped layer by layer: Data → Segment → Packet → Frame → Bits.',
    accent: '#7c8cff',
    icon: <NestedIcon />,
    Component: EncapsulationPage,
  },
  {
    id: 'tcp',
    path: '/tcp',
    title: 'TCP Connection',
    tagline: 'From SYN to TIME-WAIT: the handshake, byte counting, and teardown of a connection.',
    accent: '#4dd0c4',
    icon: <TcpIcon />,
    Component: TcpHandshakePage,
  },
  {
    id: 'tls',
    path: '/tls',
    title: 'TLS 1.3 Handshake',
    tagline: 'Step through the messages that build a secure channel in a single round trip.',
    accent: '#42d6a4',
    icon: <LockIcon />,
    Component: TlsHandshakePage,
  },
  {
    id: 'dns',
    path: '/dns',
    title: 'DNS Resolution',
    tagline: 'Follow a lookup as it walks the hierarchy: root → TLD → authoritative.',
    accent: '#ffb454',
    icon: <DnsIcon />,
    Component: DnsResolutionPage,
  },
  {
    id: 'bgp',
    path: '/bgp',
    title: 'BGP Routing',
    tagline: 'Watch a route propagate between Autonomous Systems — then reroute when a link fails.',
    accent: '#ff6b8b',
    icon: <RouteIcon />,
    Component: BgpRoutingPage,
  },
  {
    id: 'dhcp',
    path: '/dhcp',
    title: 'DHCP Lease',
    tagline: 'Step through the four-message DORA exchange that gives a device its IP address.',
    accent: '#9d7bff',
    icon: <DhcpIcon />,
    Component: DhcpLeasePage,
  },
  {
    id: 'xss',
    path: '/xss',
    title: 'Cross-Site Scripting',
    tagline: 'Reflected, stored, and DOM-based XSS — how untrusted input becomes executed markup.',
    accent: '#ef4444',
    icon: <XssIcon />,
    Component: XssPage,
  },
  {
    id: 'use-after-free',
    path: '/use-after-free',
    title: 'Use-After-Free',
    tagline: 'A dangling pointer, a reused heap slot, and a hijacked virtual call.',
    accent: '#c77dff',
    icon: <UafIcon />,
    Component: UseAfterFreePage,
  },
  {
    id: 'buffer-overflow',
    path: '/buffer-overflow',
    title: 'Stack Buffer Overflow',
    tagline: 'An unbounded copy walks past a buffer and overwrites the return address.',
    accent: '#38bdf8',
    icon: <StackIcon />,
    Component: BufferOverflowPage,
    id: 'kubernetes',
    path: '/kubernetes',
    title: 'Kubernetes Networking',
    tagline: 'How a request finds a Pod: Services, cluster DNS, kube-proxy DNAT, and Ingress.',
    accent: '#5aa9ff',
    icon: <K8sIcon />,
    Component: KubernetesPage,
  },
];

export default PAGES;
