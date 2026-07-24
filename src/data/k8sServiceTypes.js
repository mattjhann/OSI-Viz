// Single source of truth for the "Kubernetes Service Types" walkthrough:
// ClusterIP, NodePort, and LoadBalancer, and how each layers on top of the
// last to bring external traffic to a Pod.
//
// Same shape as multicastVpn.js: per-step declarative `topology` (nodes/links
// for McastTopology, reused as-is — it's generic) plus hoverable `fields`.

const NEUTRAL = '#7c8cff';
const INTERNAL = '#42d6a4';
const NODEPORT = '#ffb454';
const LB = '#5aa9ff';
const CROSS = '#9d7bff';
const FLOW = '#42d6a4';

const CLIENT = { id: 'client', label: 'Client', sub: 'internet', x: 6, y: 30, shape: 'circle', role: 'source' };
const LOADBALANCER = { id: 'lb', label: 'LoadBalancer', sub: 'cloud-provisioned', x: 24, y: 30, shape: 'box', role: 'tunnel' };
const NODEPORT_A = { id: 'nodeportA', label: 'NodePort', sub: 'node-1 · :31213/TCP', x: 46, y: 14, shape: 'box', role: 'tunnel' };
const NODEPORT_B = { id: 'nodeportB', label: 'NodePort', sub: 'node-2 · :31213/TCP', x: 46, y: 46, shape: 'box', role: 'tunnel' };
const CLUSTERIP = { id: 'clusterip', label: 'ClusterIP', sub: '10.96.100.16', x: 68, y: 30, shape: 'box', role: 'router' };
const POD_A = { id: 'podA', label: 'Pod', sub: 'node-1 · 10.244.1.7', x: 90, y: 14, shape: 'circle', role: 'receiver' };
const POD_B = { id: 'podB', label: 'Pod', sub: 'node-2 · 10.244.2.9', x: 90, y: 46, shape: 'circle', role: 'receiver' };

export const K8S_SVC_STEPS = [
  {
    id: 'overview',
    title: 'Three ways to expose a Service',
    accentColor: NEUTRAL,
    scope: 'the 3 types',
    summary:
      'Every Kubernetes Service starts as a ClusterIP. NodePort and LoadBalancer don\'t replace it — each one is the previous layer plus one more thing, building outward until traffic from the public internet can reach a Pod.',
    topology: {
      nodes: [CLIENT, LOADBALANCER, NODEPORT_A, NODEPORT_B, CLUSTERIP, POD_A, POD_B],
      links: [
        { id: 'l1', from: 'client', to: 'lb', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'lb', to: 'nodeportA', state: 'active', style: 'tunnel' },
        { id: 'l3', from: 'lb', to: 'nodeportB', state: 'active', style: 'tunnel' },
        { id: 'l4', from: 'nodeportA', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l5', from: 'nodeportB', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l6', from: 'clusterip', to: 'podA', state: 'active', style: 'tree' },
        { id: 'l7', from: 'clusterip', to: 'podB', state: 'active', style: 'tree' },
      ],
    },
    fields: [
      {
        name: 'ClusterIP',
        exampleValue: 'default type',
        detail:
          'A stable virtual IP, reachable only from inside the cluster. Every Service gets one automatically — the other two types are built on top of it.',
      },
      {
        name: 'NodePort',
        exampleValue: 'ClusterIP + a port on every node',
        detail:
          'Opens the same high port (30000–32767 by default) on every node\'s IP address, forwarding into the ClusterIP underneath. The first way to reach a Service from outside the cluster.',
      },
      {
        name: 'LoadBalancer',
        exampleValue: 'NodePort + a cloud load balancer',
        detail:
          'Asks the cloud provider to provision a real load balancer that targets the NodePort on every node — trading "remember a node IP" for one stable external address.',
      },
    ],
  },
  {
    id: 'clusterip',
    title: 'ClusterIP — internal only',
    accentColor: INTERNAL,
    scope: 'internal only',
    summary:
      'Every Service starts as a ClusterIP: a virtual address that exists only as packet-rewriting rules inside the cluster. It load-balances across its Pods perfectly well — but nothing outside the cluster can address it directly.',
    topology: {
      nodes: [CLIENT, CLUSTERIP, POD_A, POD_B],
      links: [
        { id: 'l1', from: 'client', to: 'clusterip', state: 'blocked', style: 'tunnel' },
        { id: 'l2', from: 'clusterip', to: 'podA', state: 'active', style: 'tree' },
        { id: 'l3', from: 'clusterip', to: 'podB', state: 'active', style: 'tree' },
      ],
    },
    fields: [
      {
        name: 'spec.type',
        exampleValue: 'ClusterIP (default)',
        detail:
          'Every Service is a ClusterIP unless you ask for something else — NodePort and LoadBalancer both include this layer, they don\'t replace it.',
      },
      {
        name: 'clusterIP',
        exampleValue: '10.96.100.16',
        detail:
          'A virtual address from the Service CIDR. No interface anywhere owns it — kube-proxy on every node rewrites (DNATs) packets addressed to it toward a real Pod.',
      },
      {
        name: 'reachable from',
        exampleValue: 'inside the cluster only',
        detail:
          'The Service CIDR is not routed anywhere outside the cluster network, so external clients have no way to address it directly.',
      },
    ],
  },
  {
    id: 'nodeport',
    title: 'NodePort — the same door on every node',
    accentColor: NODEPORT,
    scope: 'external, per node',
    summary:
      'A NodePort Service opens the exact same port on every node\'s IP address — even nodes with no matching Pod. Hit any node\'s IP at that port and kube-proxy forwards you into the same ClusterIP underneath.',
    topology: {
      nodes: [CLIENT, NODEPORT_A, NODEPORT_B, CLUSTERIP, POD_A, POD_B],
      links: [
        { id: 'l1', from: 'client', to: 'nodeportA', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'client', to: 'nodeportB', state: 'active', style: 'tunnel' },
        { id: 'l3', from: 'nodeportA', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l4', from: 'nodeportB', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l5', from: 'clusterip', to: 'podA', state: 'active', style: 'tree' },
        { id: 'l6', from: 'clusterip', to: 'podB', state: 'active', style: 'tree' },
      ],
    },
    fields: [
      {
        name: 'spec.type',
        exampleValue: 'NodePort',
        detail: 'Adds a port to every node, in addition to the ClusterIP the Service already has.',
      },
      {
        name: 'nodePort',
        exampleValue: '31213',
        detail:
          'Picked from the default range 30000–32767 (or set explicitly). The same port number is opened on every node, whether or not that node happens to run a matching Pod.',
      },
      {
        name: 'entry point',
        exampleValue: '<any-node-ip>:31213',
        detail:
          'A client can reach the Service through any node\'s address — but now has to know at least one node IP, and that IP can change if the node is replaced.',
      },
    ],
  },
  {
    id: 'loadbalancer',
    title: 'LoadBalancer — one address in front',
    accentColor: LB,
    scope: 'external, single address',
    summary:
      'A LoadBalancer Service asks the cloud provider — via the cloud-controller-manager — to provision a real external load balancer that targets the NodePort on every node. Clients get one stable IP or hostname and never need to know a node exists.',
    topology: {
      nodes: [CLIENT, LOADBALANCER, NODEPORT_A, NODEPORT_B, CLUSTERIP, POD_A, POD_B],
      links: [
        { id: 'l1', from: 'client', to: 'lb', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'lb', to: 'nodeportA', state: 'active', style: 'tunnel' },
        { id: 'l3', from: 'lb', to: 'nodeportB', state: 'active', style: 'tunnel' },
        { id: 'l4', from: 'nodeportA', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l5', from: 'nodeportB', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l6', from: 'clusterip', to: 'podA', state: 'active', style: 'tree' },
        { id: 'l7', from: 'clusterip', to: 'podB', state: 'active', style: 'tree' },
      ],
    },
    fields: [
      {
        name: 'spec.type',
        exampleValue: 'LoadBalancer',
        detail: 'Still creates a NodePort (and the ClusterIP under that) — this type only adds the cloud load balancer in front.',
      },
      {
        name: 'status.loadBalancer.ingress',
        exampleValue: '203.0.113.44',
        detail:
          'Populated asynchronously once the cloud provider finishes provisioning — an external IP or DNS hostname, depending on the provider.',
      },
      {
        name: 'health checks',
        exampleValue: 'LB polls each node\'s NodePort',
        detail:
          'The cloud load balancer only sends traffic to nodes that respond healthy on the NodePort, so a dead or draining node quietly drops out of rotation.',
      },
    ],
  },
  {
    id: 'any-node-any-pod',
    title: 'Any node, any Pod',
    accentColor: CROSS,
    scope: 'cross-node routing',
    summary:
      'kube-proxy programs identical forwarding rules on every node — the full list of ready Pod endpoints, cluster-wide. Traffic that enters through node-1\'s NodePort can just as easily be sent on to a Pod running on node-2.',
    topology: {
      nodes: [CLIENT, LOADBALANCER, NODEPORT_A, CLUSTERIP, POD_B],
      links: [
        { id: 'l1', from: 'client', to: 'lb', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'lb', to: 'nodeportA', state: 'active', style: 'tunnel' },
        { id: 'l3', from: 'nodeportA', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l4', from: 'clusterip', to: 'podB', state: 'active', style: 'tree' },
      ],
    },
    fields: [
      {
        name: 'externalTrafficPolicy: Cluster',
        exampleValue: 'default',
        detail:
          'Every node\'s rules list every ready Pod cluster-wide, so traffic can hop to any node to reach any Pod — spreads load evenly, at the cost of an extra network hop and the client\'s real source IP being replaced (SNAT).',
      },
      {
        name: 'externalTrafficPolicy: Local',
        exampleValue: 'opt-in',
        detail:
          'Restricts each node to forwarding only to Pods running locally, preserving the client\'s source IP and skipping the extra hop — but a node with no local Pod refuses the connection, and load can become uneven.',
      },
      {
        name: 'this hop',
        exampleValue: 'entered node-1 → served by node-2',
        detail: 'The default Cluster-mode trade-off in action: which node you happened to connect to has no bearing on which Pod actually answers.',
      },
    ],
  },
  {
    id: 'journey',
    title: 'The full path',
    accentColor: FLOW,
    scope: 'full path',
    summary:
      'Put together: LoadBalancer gives the outside world one address, NodePort repeats that entry point on every node, ClusterIP is the stable internal identity that load-balances across Pods, and kube-proxy\'s rewriting rules tie all three layers into a single working path.',
    topology: {
      nodes: [CLIENT, LOADBALANCER, NODEPORT_A, NODEPORT_B, CLUSTERIP, POD_A, POD_B],
      links: [
        { id: 'l1', from: 'client', to: 'lb', state: 'active', style: 'tunnel' },
        { id: 'l2', from: 'lb', to: 'nodeportA', state: 'active', style: 'tunnel' },
        { id: 'l3', from: 'lb', to: 'nodeportB', state: 'active', style: 'tunnel' },
        { id: 'l4', from: 'nodeportA', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l5', from: 'nodeportB', to: 'clusterip', state: 'active', style: 'tunnel' },
        { id: 'l6', from: 'clusterip', to: 'podA', state: 'active', style: 'tree' },
        { id: 'l7', from: 'clusterip', to: 'podB', state: 'active', style: 'tree' },
      ],
    },
    fields: [
      {
        name: 'LoadBalancer',
        exampleValue: 'one external address',
        detail: 'The only layer clients outside the cluster ever need to know about.',
      },
      {
        name: 'NodePort',
        exampleValue: 'the same door on every node',
        detail: 'What the LoadBalancer actually targets — and still usable directly if you know a node\'s IP.',
      },
      {
        name: 'ClusterIP',
        exampleValue: 'stable internal identity',
        detail: 'What every other layer ultimately forwards into — the one piece every Service has, with or without external exposure.',
      },
      {
        name: 'kube-proxy',
        exampleValue: 'the rewriting rules underneath',
        detail: 'Programs the iptables/IPVS rules on every node that make all three layers actually forward packets to a live Pod.',
      },
    ],
  },
];

export default K8S_SVC_STEPS;
