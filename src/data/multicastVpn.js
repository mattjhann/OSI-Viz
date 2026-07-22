// Single source of truth for the "Multicast over VPN Tunnels" comparison.
//
// Unlike the other visualizations (a single linear message exchange), this one
// is a comparison: does IP multicast survive each of five VPN tunnel designs?
// Each step is a self-contained topology (per-step `nodes`/`links`, in a
// 0..100 x 0..60 viewBox) plus a pass/fail `verdict` and hoverable `fields`.
//
// Nodes: { id, label, sub, x, y, shape: 'circle'|'box', role }
// Links: { id, from, to, state: 'active'|'blocked', style: 'tree'|'tunnel'|'replica' }
//   'blocked' links stop partway and show an X — the packet dies there.

const NEUTRAL = '#7c8cff';
const GOOD = '#42d6a4';
const BAD = '#ff6b8b';
const MANUAL = '#ffb454';

const SOURCE = { id: 'source', label: 'Multicast Source', sub: '239.1.1.1 (group)', x: 10, y: 30, shape: 'circle', role: 'source' };
const RECEIVER = { id: 'receiver', label: 'Receiver', sub: 'joined via IGMP', x: 90, y: 30, shape: 'circle', role: 'receiver' };

export const MULTICAST_VPN_STEPS = [
  {
    id: 'fundamentals',
    title: 'Multicast needs a tree',
    accentColor: NEUTRAL,
    verdict: 'context',
    verdictLabel: 'how it normally works',
    summary:
      'On a native network, multicast relies on group membership (IGMP/MLD) and multicast-aware routing (PIM) to build a distribution tree. A router near the receivers — not the source — replicates the packet, so only one copy ever crosses any given link.',
    topology: {
      nodes: [
        { id: 'source', label: 'Multicast Source', sub: '239.1.1.1 (group)', x: 8, y: 30, shape: 'circle', role: 'source' },
        { id: 'router', label: 'PIM Router', sub: 'branch point', x: 38, y: 30, shape: 'box', role: 'router' },
        { id: 'rA', label: 'Receiver A', sub: 'joined via IGMP', x: 86, y: 15, shape: 'circle', role: 'receiver' },
        { id: 'rB', label: 'Receiver B', sub: 'joined via IGMP', x: 86, y: 45, shape: 'circle', role: 'receiver' },
      ],
      links: [
        { id: 'l1', from: 'source', to: 'router', state: 'active', style: 'tree' },
        { id: 'l2', from: 'router', to: 'rA', state: 'active', style: 'tree' },
        { id: 'l3', from: 'router', to: 'rB', state: 'active', style: 'tree' },
      ],
    },
    fields: [
      {
        name: 'IGMP Membership Report',
        exampleValue: 'Join 239.1.1.1',
        detail:
          'A receiver tells its local router it wants traffic for this multicast group. The router uses this to build the tree only where it is needed.',
      },
      {
        name: 'PIM',
        exampleValue: 'shared / source tree',
        detail:
          'Protocol Independent Multicast builds the actual distribution tree between routers, so the network — not the sender — handles replication.',
      },
      {
        name: 'Replication point',
        exampleValue: 'at the branch router',
        detail:
          'Copies are made close to the receivers, at the last point the tree forks. The source and the links near it only ever carry one copy.',
      },
    ],
  },
  {
    id: 'policy-ipsec',
    title: 'Policy-based IPsec (SPD)',
    accentColor: BAD,
    verdict: 'fail',
    verdictLabel: 'multicast fails',
    summary:
      'Classic policy-based IPsec matches traffic against a Security Policy Database keyed to unicast source/destination pairs. A multicast packet does not match a src/dst unicast selector, so it is dropped — or sent unencrypted, bypassing the tunnel entirely.',
    topology: {
      nodes: [
        SOURCE,
        { id: 'spd', label: 'SPD', sub: 'policy-based IPsec', x: 48, y: 30, shape: 'box', role: 'tunnel' },
        RECEIVER,
      ],
      links: [
        { id: 'l1', from: 'source', to: 'spd', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'spd', to: 'receiver', state: 'blocked', style: 'tunnel' },
      ],
    },
    fields: [
      {
        name: 'SPD selector',
        exampleValue: 'src 10.0.0.5 → dst 10.0.0.10',
        detail:
          'A Security Policy Database entry matches a unicast source/destination pair (or CIDR). It has no concept of a multicast group address.',
      },
      {
        name: 'Multicast destination',
        exampleValue: '239.1.1.1 — no match',
        detail:
          'The group address does not match any policy selector, so the IPsec stack has nothing to apply the tunnel to.',
      },
      {
        name: 'Result',
        exampleValue: 'dropped or sent in clear',
        detail:
          'Depending on the implementation\'s default policy, the packet is either silently dropped or forwarded outside the tunnel — unencrypted.',
      },
      {
        name: 'Common workaround',
        exampleValue: 'wrap in GRE first',
        detail:
          'Put the multicast traffic inside a GRE tunnel, then run IPsec over the GRE tunnel\'s unicast endpoints — see the next step.',
      },
    ],
  },
  {
    id: 'gre-over-ipsec',
    title: 'GRE-over-IPsec',
    accentColor: GOOD,
    verdict: 'works',
    verdictLabel: 'works',
    summary:
      'Wrap the multicast packet in GRE first — GRE turns it into an ordinary unicast IP packet between the two tunnel endpoints — then encrypt that GRE tunnel with IPsec. This is the basis of DMVPN-style designs.',
    topology: {
      nodes: [
        SOURCE,
        { id: 'gre', label: 'GRE Tunnel', sub: 'wraps as unicast', x: 38, y: 30, shape: 'box', role: 'tunnel' },
        { id: 'ipsec', label: 'IPsec (ESP)', sub: 'encrypts the GRE', x: 63, y: 30, shape: 'box', role: 'tunnel' },
        RECEIVER,
      ],
      links: [
        { id: 'l1', from: 'source', to: 'gre', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'gre', to: 'ipsec', state: 'active', style: 'tunnel' },
        { id: 'l3', from: 'ipsec', to: 'receiver', state: 'active', style: 'tunnel' },
      ],
    },
    fields: [
      {
        name: 'GRE header',
        exampleValue: 'new unicast IP header',
        detail:
          'GRE encapsulates the original multicast packet inside a new IP packet addressed unicast, tunnel-endpoint to tunnel-endpoint.',
      },
      {
        name: 'IPsec SPD selector',
        exampleValue: 'src/dst = GRE endpoints',
        detail:
          'Because GRE already turned the traffic into a plain unicast flow, it now matches an ordinary IPsec policy selector without issue.',
      },
      {
        name: 'Use case',
        exampleValue: 'DMVPN hub-and-spoke',
        detail:
          'This GRE-over-IPsec pattern, generalized with multipoint GRE (mGRE), is the foundation of DMVPN — a common way to run dynamic routing and multicast over an IPsec overlay.',
      },
    ],
  },
  {
    id: 'vti-ipsec',
    title: 'Route-based IPsec (VTI)',
    accentColor: MANUAL,
    verdict: 'works-manual',
    verdictLabel: 'works — needs setup',
    summary:
      'Modern route-based strongSwan using a VTI (Virtual Tunnel Interface, via Linux XFRM) creates a genuine network interface for the tunnel. Because it is a real interface, a multicast routing daemon can run over it — but that has to be configured explicitly, it is not automatic.',
    topology: {
      nodes: [
        SOURCE,
        { id: 'vti', label: 'VTI Interface', sub: 'Linux XFRM', x: 38, y: 30, shape: 'box', role: 'tunnel' },
        { id: 'pim', label: 'pimd / smcroute', sub: 'manual setup', x: 63, y: 30, shape: 'box', role: 'router' },
        RECEIVER,
      ],
      links: [
        { id: 'l1', from: 'source', to: 'vti', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'vti', to: 'pim', state: 'active', style: 'tunnel' },
        { id: 'l3', from: 'pim', to: 'receiver', state: 'active', style: 'tunnel' },
      ],
    },
    fields: [
      {
        name: 'VTI interface',
        exampleValue: 'ipsec0, XFRM-backed',
        detail:
          'Unlike policy-based IPsec\'s implicit SPD match, a VTI is a real interface the kernel can route through — which is what makes multicast routing possible at all.',
      },
      {
        name: 'Multicast routing daemon',
        exampleValue: 'pimd or smcroute',
        detail:
          'A userspace daemon must be installed and configured to run PIM (or simpler static multicast forwarding) over the VTI. strongSwan itself does not do this for you.',
      },
      {
        name: 'Result',
        exampleValue: 'works, nothing automatic',
        detail:
          'Once the daemon is running, multicast flows over the tunnel like any other interface — but every hop needs this set up deliberately.',
      },
    ],
  },
  {
    id: 'openvpn-tun',
    title: 'OpenVPN tun (routed, L3)',
    accentColor: MANUAL,
    verdict: 'works-manual',
    verdictLabel: 'works — needs setup',
    summary:
      'OpenVPN in the default, routed tun mode creates an L3 point-to-point interface — the same story as strongSwan VTI. No native multicast; you need PIM or a simpler multicast proxy layered on top.',
    topology: {
      nodes: [
        SOURCE,
        { id: 'tun', label: 'tun Interface', sub: 'routed, L3', x: 38, y: 30, shape: 'box', role: 'tunnel' },
        { id: 'proxy', label: 'PIM / mcast proxy', sub: 'manual setup', x: 63, y: 30, shape: 'box', role: 'router' },
        RECEIVER,
      ],
      links: [
        { id: 'l1', from: 'source', to: 'tun', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'tun', to: 'proxy', state: 'active', style: 'tunnel' },
        { id: 'l3', from: 'proxy', to: 'receiver', state: 'active', style: 'tunnel' },
      ],
    },
    fields: [
      {
        name: 'tun interface',
        exampleValue: 'L3, point-to-point',
        detail:
          'OpenVPN\'s default and most common mode. It presents a routed IP interface — conceptually identical to a VTI — with no multicast awareness built in.',
      },
      {
        name: 'Multicast routing',
        exampleValue: 'PIM or mcast proxy',
        detail:
          'Just like VTI-based IPsec, something has to be layered on top — a PIM daemon or a lighter multicast proxy — before group traffic will cross the tunnel.',
      },
      {
        name: 'Contrast',
        exampleValue: 'vs. tap mode, next step',
        detail:
          'This is the routed default. Switching OpenVPN to tap (bridged) mode changes the story completely.',
      },
    ],
  },
  {
    id: 'openvpn-tap',
    title: 'OpenVPN tap (bridged, L2)',
    accentColor: GOOD,
    verdict: 'works',
    verdictLabel: 'works natively',
    summary:
      'OpenVPN in tap mode creates an actual Ethernet bridge across the tunnel. Multicast and broadcast frames just flow through like a normal LAN segment — no PIM, no multicast-routing config. mDNS, SSDP, and UPnP-style discovery just work.',
    topology: {
      nodes: [
        SOURCE,
        { id: 'tap', label: 'tap Bridge', sub: 'bridged, L2', x: 48, y: 30, shape: 'box', role: 'tunnel' },
        RECEIVER,
      ],
      links: [
        { id: 'l1', from: 'source', to: 'tap', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'tap', to: 'receiver', state: 'active', style: 'tunnel' },
      ],
    },
    fields: [
      {
        name: 'tap interface',
        exampleValue: 'L2 Ethernet bridge',
        detail:
          'tap mode tunnels whole Ethernet frames rather than routing IP packets — the tunnel behaves like a switch port on the same LAN segment.',
      },
      {
        name: 'Multicast frames',
        exampleValue: 'flow untouched',
        detail:
          'Because the bridge does not care about IP semantics, multicast and broadcast frames cross it exactly like unicast — no PIM, no mroute configuration.',
      },
      {
        name: 'Example',
        exampleValue: 'mDNS, SSDP, UPnP',
        detail:
          'LAN discovery protocols that rely on multicast/broadcast — like mDNS (Bonjour), SSDP, and UPnP — just work across a tap-mode tunnel with zero extra setup.',
      },
    ],
  },
  {
    id: 'caveat',
    title: 'The catch: hub replication',
    accentColor: MANUAL,
    verdict: 'caveat',
    verdictLabel: 'not a true multicast tree',
    summary:
      'Even where multicast "works" over a tunnel, it rarely gets the bandwidth savings of native multicast. With multiple remote peers, each terminating its own tunnel or SA, replication tends to happen at the hub — one full copy per peer — behaving more like unicast replication than a real multicast tree.',
    topology: {
      nodes: [
        { id: 'hub', label: 'Hub / Concentrator', sub: 'terminates every tunnel', x: 10, y: 30, shape: 'circle', role: 'source' },
        { id: 'tunA', label: 'Tunnel / SA → A', sub: 'full copy #1', x: 46, y: 15, shape: 'box', role: 'tunnel' },
        { id: 'tunB', label: 'Tunnel / SA → B', sub: 'full copy #2', x: 46, y: 45, shape: 'box', role: 'tunnel' },
        { id: 'rA', label: 'Peer A', sub: 'receiver', x: 86, y: 15, shape: 'circle', role: 'receiver' },
        { id: 'rB', label: 'Peer B', sub: 'receiver', x: 86, y: 45, shape: 'circle', role: 'receiver' },
      ],
      links: [
        { id: 'l1', from: 'hub', to: 'tunA', state: 'active', style: 'replica' },
        { id: 'l2', from: 'tunA', to: 'rA', state: 'active', style: 'replica' },
        { id: 'l3', from: 'hub', to: 'tunB', state: 'active', style: 'replica' },
        { id: 'l4', from: 'tunB', to: 'rB', state: 'active', style: 'replica' },
      ],
    },
    fields: [
      {
        name: 'Per-peer tunnels',
        exampleValue: 'one SA per remote site',
        detail:
          'Unlike a native multicast tree, each remote peer terminates its own IPsec SA or VPN session — there is no shared branch point inside the overlay.',
      },
      {
        name: 'Hub uplink',
        exampleValue: 'N copies for N peers',
        detail:
          'Compare to step 1: there, one copy left the source and the network replicated it near the edge. Here, the hub itself must send a full duplicate stream down every tunnel.',
      },
      {
        name: 'Closer to a real tree',
        exampleValue: 'mGRE hub-and-spoke + PIM',
        detail:
          'Multipoint GRE combined with PIM across the hub-and-spoke overlay can approximate genuine multicast replication — but it is a deliberate, more elaborate design, not something you get by default.',
      },
    ],
  },
];

export default MULTICAST_VPN_STEPS;
