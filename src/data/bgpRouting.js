// Single source of truth for the BGP routing walkthrough.
//
// Models eBGP between five Autonomous Systems. AS65010 originates the prefix
// 203.0.113.0/24; AS65001 ("you") wants to reach it. There are two paths:
//   primary  65001 → 65002 → 65010            (AS_PATH length 2 — best)
//   backup   65001 → 65003 → 65004 → 65010    (AS_PATH length 3)
// Best path = shortest AS_PATH. The 65002–65010 link then fails, the route is
// withdrawn, and BGP reconverges onto the backup path.
//
// Coordinates are in the SVG viewBox (0 0 100 56). `topology` per step is
// declarative state the renderer reads; `message` (optional) is a BGP
// UPDATE/WITHDRAW whose `fields` reuse the FieldDetail shape.

export const PREFIX = '203.0.113.0/24';

const ORIGIN = '#9d7bff';
const NEUTRAL = '#7c8cff';
const STEP = '#ffb454';
const GOOD = '#42d6a4';
const BAD = '#ff6b8b';

export const AS_NODES = [
  { id: '65001', asn: 'AS65001', name: 'Your ISP', x: 10, y: 28, role: 'vantage' },
  { id: '65002', asn: 'AS65002', name: 'Transit A', x: 45, y: 11, role: 'transit' },
  { id: '65003', asn: 'AS65003', name: 'Transit B', x: 38, y: 47, role: 'transit' },
  { id: '65004', asn: 'AS65004', name: 'Transit C', x: 70, y: 49, role: 'transit' },
  { id: '65010', asn: 'AS65010', name: 'Origin', x: 90, y: 27, role: 'origin' },
];

export const LINKS = [
  { id: 'l1', a: '65001', b: '65002' },
  { id: 'l2', a: '65002', b: '65010' }, // the link that fails
  { id: 'l3', a: '65001', b: '65003' },
  { id: 'l4', a: '65003', b: '65004' },
  { id: 'l5', a: '65004', b: '65010' },
];

const DOWN = ['65002', '65010'];

export const BGP_STEPS = [
  {
    id: 'topology',
    title: 'A graph of Autonomous Systems',
    accentColor: NEUTRAL,
    summary:
      'The Internet is tens of thousands of Autonomous Systems (ASes) — independently run networks — peering with one another. BGP is how they exchange reachability: which AS can reach which block of addresses.',
    topology: { learned: [], activePath: [], downLinks: [], flow: false },
    message: null,
  },
  {
    id: 'originate',
    title: `AS65010 originates ${PREFIX}`,
    accentColor: ORIGIN,
    summary:
      'The origin AS announces that it owns the prefix. It sends a BGP UPDATE to its neighbours describing how to reach it.',
    topology: { learned: ['65010'], activePath: [], downLinks: [], flow: false },
    message: {
      type: 'UPDATE',
      fields: [
        {
          name: 'NLRI',
          exampleValue: PREFIX,
          detail:
            'Network Layer Reachability Information — the prefix (block of IP addresses) being advertised as reachable.',
        },
        {
          name: 'AS_PATH',
          exampleValue: '65010',
          detail:
            'The list of ASes the route has traversed. The origin starts it with just its own ASN. Each AS that re-advertises prepends itself, so the path also prevents loops.',
        },
        {
          name: 'NEXT_HOP',
          exampleValue: '198.51.100.10',
          detail:
            'The IP address to forward traffic to in order to use this route.',
        },
        {
          name: 'ORIGIN',
          exampleValue: 'IGP',
          detail:
            'How the prefix entered BGP. IGP means it was originated by the AS itself (via the network statement), rather than redistributed.',
        },
      ],
    },
  },
  {
    id: 'propagate',
    title: 'Neighbours learn the route',
    accentColor: STEP,
    summary:
      'Each neighbour receives the UPDATE and, before passing it on, prepends its own ASN to AS_PATH. The path grows by one AS at every hop, recording the full route back to the origin.',
    topology: { learned: ['65010', '65002', '65004'], activePath: [], downLinks: [], flow: false, arrows: [['65010', '65002'], ['65010', '65004']] },
    message: {
      type: 'UPDATE',
      fields: [
        {
          name: 'AS_PATH (via 65002)',
          exampleValue: '65002 65010',
          detail:
            'AS65002 prepended itself before re-advertising. Reading right-to-left traces the route back to the origin AS65010.',
        },
        {
          name: 'AS_PATH (via 65004)',
          exampleValue: '65004 65010',
          detail:
            'AS65004 learned the same prefix directly from the origin and prepended itself too. The same prefix can arrive by multiple paths.',
        },
        {
          name: 'loop prevention',
          exampleValue: 'reject if own ASN in path',
          detail:
            'If an AS sees its own ASN already in a received AS_PATH, it rejects the route — this is how the path-vector design avoids routing loops.',
        },
      ],
    },
  },
  {
    id: 'two-paths',
    title: 'AS65001 learns two paths',
    accentColor: STEP,
    summary:
      'The route keeps propagating until AS65001 has heard about the prefix two ways: a short path via AS65002, and a longer one via AS65003 → AS65004.',
    topology: {
      learned: ['65010', '65002', '65003', '65004', '65001'],
      activePath: [],
      downLinks: [],
      flow: false,
      arrows: [['65002', '65001'], ['65004', '65003'], ['65003', '65001']],
    },
    message: {
      type: 'UPDATE',
      fields: [
        {
          name: 'candidate A',
          exampleValue: 'AS_PATH 65002 65010',
          detail:
            'Reaches the prefix in 2 AS hops, through Transit A.',
        },
        {
          name: 'candidate B',
          exampleValue: 'AS_PATH 65003 65004 65010',
          detail:
            'Reaches the same prefix in 3 AS hops, through Transit B then Transit C.',
        },
      ],
    },
  },
  {
    id: 'best-path',
    title: 'Best path: shortest AS_PATH',
    accentColor: GOOD,
    summary:
      'Among equal candidates, the shorter AS_PATH wins, so AS65001 installs the route via AS65002 and forwards traffic along it. (Real BGP first compares LOCAL_PREF and other policy, but path length is the classic tie-breaker.)',
    topology: {
      learned: ['65010', '65002', '65003', '65004', '65001'],
      activePath: ['65001', '65002', '65010'],
      downLinks: [],
      flow: true,
    },
    message: {
      type: 'UPDATE',
      fields: [
        {
          name: 'via 65002',
          exampleValue: '2 hops · BEST',
          detail:
            'Shortest AS_PATH (length 2), so this becomes the active route installed in the forwarding table.',
        },
        {
          name: 'via 65003',
          exampleValue: '3 hops · backup',
          detail:
            'Kept as an alternative in the BGP table but not installed, because its AS_PATH is longer.',
        },
      ],
    },
  },
  {
    id: 'failure',
    title: 'A link fails',
    accentColor: BAD,
    summary:
      'The peering link between AS65002 and the origin goes down — a fibre cut. The primary path is broken, and AS65002 can no longer reach the prefix that way.',
    topology: {
      learned: ['65010', '65002', '65003', '65004', '65001'],
      activePath: ['65001', '65002', '65010'],
      downLinks: [DOWN],
      flow: false,
    },
    message: null,
  },
  {
    id: 'withdraw',
    title: 'The route is withdrawn',
    accentColor: BAD,
    summary:
      'AS65002 sends AS65001 a BGP UPDATE containing a Withdrawn Routes field — explicitly retracting the prefix. AS65001 removes the now-invalid primary route from its table.',
    topology: {
      learned: ['65010', '65003', '65004', '65001'],
      activePath: [],
      downLinks: [DOWN],
      flow: false,
    },
    message: {
      type: 'WITHDRAW',
      fields: [
        {
          name: 'Withdrawn Routes',
          exampleValue: PREFIX,
          detail:
            'A BGP UPDATE can carry withdrawals as well as advertisements. Listing the prefix here tells the peer to stop using any route it learned for it from this neighbour.',
        },
        {
          name: 'trigger',
          exampleValue: 'link down',
          detail:
            'The withdrawal is generated because the session/route over the failed link is gone. (If a peer simply vanished, the BGP hold timer — typically 90s — would eventually tear the session down instead.)',
        },
      ],
    },
  },
  {
    id: 'reconverge',
    title: 'BGP reconverges',
    accentColor: GOOD,
    summary:
      'With the primary gone, AS65001 re-runs best-path selection on what remains and installs the surviving route via AS65003 → AS65004. This settling process is BGP convergence.',
    topology: {
      learned: ['65010', '65003', '65004', '65001'],
      activePath: ['65001', '65003', '65004', '65010'],
      downLinks: [DOWN],
      flow: false,
    },
    message: {
      type: 'UPDATE',
      fields: [
        {
          name: 'new best path',
          exampleValue: 'AS_PATH 65003 65004 65010',
          detail:
            'The backup, longer all along, is now the only valid path — so it becomes the active route.',
        },
        {
          name: 'NEXT_HOP',
          exampleValue: '198.51.100.3',
          detail:
            'Forwarding shifts to the next hop toward AS65003 as the new route is installed.',
        },
      ],
    },
  },
  {
    id: 'recovered',
    title: 'Traffic reroutes',
    accentColor: GOOD,
    summary:
      'Traffic to the prefix now flows over the backup path. No human intervened — BGP detected the failure, withdrew the dead route, and converged on a working one. The trade-off is convergence time: seconds, occasionally longer at Internet scale.',
    topology: {
      learned: ['65010', '65003', '65004', '65001'],
      activePath: ['65001', '65003', '65004', '65010'],
      downLinks: [DOWN],
      flow: true,
    },
    message: null,
  },
];

export default BGP_STEPS;
