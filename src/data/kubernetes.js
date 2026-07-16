// Single source of truth for the Kubernetes networking walkthrough.
//
// Follows a request into a cluster: Pods get flat-network IPs (CNI), Pods
// churn so a Service provides a stable ClusterIP, CoreDNS resolves the
// Service name, kube-proxy DNATs the virtual IP to a real Pod, and an
// Ingress brings outside HTTP traffic in.
//
// Coordinates are in the SVG viewBox (0 0 100 60). `topology` per step is
// declarative state the renderer reads; `fields` reuse the FieldDetail shape.

const NEUTRAL = '#7c8cff';
const POD = '#5aa9ff';
const BAD = '#ff6b8b';
const SERVICE = '#42d6a4';
const DNS = '#ffb454';
const PROXY = '#9d7bff';
const FLOW = '#42d6a4';

// Boxes the request travels between. Pods live inside a node.
export const K8S_NODES = [
  { id: 'node1', label: 'node-1', sublabel: '10.244.1.0/24', x: 58, y: 4, w: 39, h: 24 },
  { id: 'node2', label: 'node-2', sublabel: '10.244.2.0/24', x: 58, y: 32, w: 39, h: 24 },
];

export const K8S_PODS = [
  { id: 'web1', node: 'node1', label: 'web-abc', ip: '10.244.1.3', x: 67.5, y: 18 },
  { id: 'dns', node: 'node1', label: 'coredns', ip: '10.244.1.2', x: 87.5, y: 18 },
  { id: 'web2', node: 'node2', label: 'web-def', ip: '10.244.2.4', x: 67.5, y: 46 },
  { id: 'web3', node: 'node2', label: 'web-ghi', ip: '10.244.2.7', x: 87.5, y: 46 },
];

// Standalone actors outside/at the edge of the cluster.
export const K8S_ACTORS = [
  { id: 'client', label: 'Client', sublabel: 'internet', x: 8, y: 30 },
  { id: 'ingress', label: 'Ingress', sublabel: 'nginx', x: 27, y: 30 },
  { id: 'svc', label: 'Service: web', sublabel: '10.96.0.10', x: 45, y: 30 },
];

export const K8S_STEPS = [
  {
    id: 'cluster',
    title: 'A cluster of nodes running Pods',
    accentColor: NEUTRAL,
    summary:
      'A Kubernetes cluster is a set of machines (nodes) that run your workloads as Pods — the smallest deployable unit, one or more containers sharing a network namespace. Here two worker nodes run three replicas of a web app plus CoreDNS.',
    topology: { hiddenPods: ['web3'], showService: false, showIngress: false },
    message: {
      tag: 'the pieces',
      fields: [
        {
          name: 'Node',
          exampleValue: 'node-1, node-2',
          detail:
            'A worker machine (VM or bare metal). Each node runs a kubelet (starts Pods), a container runtime, and kube-proxy (programs Service routing).',
        },
        {
          name: 'Pod',
          exampleValue: 'web-abc, web-def',
          detail:
            'One or more containers that share an IP address and network namespace. Pods are scheduled onto nodes and are deliberately disposable.',
        },
        {
          name: 'Deployment',
          exampleValue: 'web · replicas: 2',
          detail:
            'Declares the desired state: "keep 2 replicas of this Pod running." Its ReplicaSet replaces Pods that die — which is why nothing should depend on an individual Pod.',
        },
      ],
    },
  },
  {
    id: 'pod-ips',
    title: 'Every Pod gets its own IP',
    accentColor: POD,
    summary:
      'The CNI network plugin gives each Pod a real, routable IP from its node\'s Pod CIDR. The fundamental Kubernetes rule: every Pod can reach every other Pod directly, across nodes, with no NAT in between.',
    topology: { hiddenPods: ['web3'], activePods: ['web1', 'web2', 'dns'], showService: false, showIngress: false },
    message: {
      tag: 'CNI · pod network',
      fields: [
        {
          name: 'Pod CIDR (node-1)',
          exampleValue: '10.244.1.0/24',
          detail:
            'Each node is assigned a slice of the cluster\'s Pod address space. Pods on node-1 get 10.244.1.x addresses; the CNI plugin routes between the slices.',
        },
        {
          name: 'podIP',
          exampleValue: '10.244.1.3',
          detail:
            'Assigned when the Pod starts and released when it dies. Inside the Pod, containers see this as their own address on eth0.',
        },
        {
          name: 'CNI plugin',
          exampleValue: 'Cilium / Calico / flannel',
          detail:
            'The Container Network Interface plugin wires each new Pod into the network — creating its veth pair, assigning the IP, and programming routes (or an overlay like VXLAN) between nodes.',
        },
        {
          name: 'flat network rule',
          exampleValue: 'pod ↔ pod, no NAT',
          detail:
            'Kubernetes requires that any Pod can reach any Pod by its IP without address translation. This keeps the model simple — the complexity lives inside the CNI plugin.',
        },
      ],
    },
  },
  {
    id: 'churn',
    title: 'Pods die — and their IPs change',
    accentColor: BAD,
    summary:
      'A node drains, a Pod crashes, a Deployment rolls out a new version — Pods are replaced all the time. The ReplicaSet starts a substitute, but it lands wherever the scheduler puts it, with a brand-new IP. Hard-coding a Pod IP is a bug.',
    topology: { deadPods: ['web1'], activePods: ['web3'], showService: false, showIngress: false },
    message: {
      tag: 'ReplicaSet reconciles',
      fields: [
        {
          name: 'web-abc',
          exampleValue: '10.244.1.3 · gone',
          detail:
            'The Pod on node-1 died. Its IP is released back to the pool and may later be handed to a completely different Pod.',
        },
        {
          name: 'web-ghi',
          exampleValue: '10.244.2.7 · new',
          detail:
            'The ReplicaSet noticed replicas dropped below the desired count and created a replacement — scheduled onto node-2, with a new IP from node-2\'s CIDR.',
        },
        {
          name: 'the problem',
          exampleValue: 'clients pointed at 10.244.1.3 now fail',
          detail:
            'Anything that cached the old Pod IP is broken. Kubernetes needs a stable name and address that outlives any individual Pod — that is exactly what a Service provides.',
        },
      ],
    },
  },
  {
    id: 'service',
    title: 'A Service is a stable virtual IP',
    accentColor: SERVICE,
    summary:
      'A Service gets a ClusterIP that never changes for its lifetime. Its label selector continuously tracks the healthy Pods that match; the matching Pod IPs become the Service\'s endpoints. Clients talk to the Service and never learn about individual Pods.',
    topology: {
      hiddenPods: ['web1'],
      showService: true,
      showIngress: false,
      selector: ['web2', 'web3'],
      activePods: ['web2', 'web3'],
    },
    message: {
      tag: 'Service manifest',
      fields: [
        {
          name: 'metadata.name',
          exampleValue: 'web',
          detail:
            'The Service\'s name — also its DNS name inside the cluster. This is what other workloads use to find it.',
        },
        {
          name: 'spec.clusterIP',
          exampleValue: '10.96.0.10',
          detail:
            'A virtual IP allocated from the Service CIDR. No interface anywhere owns this address — it exists only as packet-rewriting rules on every node.',
        },
        {
          name: 'spec.selector',
          exampleValue: 'app: web',
          detail:
            'A label query. Every running Pod whose labels match is automatically added to the Service\'s endpoints; Pods that die are removed. No manual registration.',
        },
        {
          name: 'port → targetPort',
          exampleValue: '80 → 8080',
          detail:
            'The Service listens on port 80 and forwards to port 8080 inside the Pods — so the app can pick its own port without clients caring.',
        },
        {
          name: 'EndpointSlice',
          exampleValue: '10.244.2.4:8080, 10.244.2.7:8080',
          detail:
            'The live list of ready Pod IPs behind the Service, maintained by the control plane. This is what kube-proxy reads to program the actual forwarding rules.',
        },
      ],
    },
  },
  {
    id: 'dns',
    title: 'CoreDNS resolves the Service name',
    accentColor: DNS,
    summary:
      'Workloads don\'t hard-code the ClusterIP either — they use the Service\'s DNS name. Every Pod\'s resolv.conf points at CoreDNS, which answers "web" with the Service\'s ClusterIP. Same DNS mechanics as the public Internet, scoped to the cluster.',
    topology: {
      hiddenPods: ['web1'],
      showService: true,
      showIngress: false,
      activePods: ['dns'],
      selector: ['web2', 'web3'],
    },
    message: {
      tag: 'DNS query · A record',
      fields: [
        {
          name: 'query',
          exampleValue: 'web.default.svc.cluster.local',
          detail:
            'The full form: <service>.<namespace>.svc.<cluster-domain>. Pods in the same namespace can just say "web" — the search domains in resolv.conf fill in the rest.',
        },
        {
          name: 'answer',
          exampleValue: 'A 10.96.0.10',
          detail:
            'CoreDNS returns the Service\'s ClusterIP — not a Pod IP. The stable virtual address is the whole point; Pod churn never invalidates this answer.',
        },
        {
          name: 'resolv.conf',
          exampleValue: 'nameserver 10.96.0.53',
          detail:
            'The kubelet writes every Pod\'s resolv.conf to point at the cluster DNS Service (itself a ClusterIP, backed by the CoreDNS Pods).',
        },
      ],
    },
  },
  {
    id: 'kube-proxy',
    title: 'kube-proxy rewrites the destination',
    accentColor: PROXY,
    summary:
      'Nothing actually listens on 10.96.0.10. On every node, kube-proxy programs iptables/IPVS rules: a packet addressed to the ClusterIP is intercepted and its destination rewritten (DNAT) to one of the endpoint Pods, picked per-connection.',
    topology: {
      hiddenPods: ['web1'],
      showService: true,
      showIngress: false,
      selector: ['web2', 'web3'],
      path: ['svc', 'web2'],
      activePods: ['web2'],
    },
    message: {
      tag: 'DNAT on the node',
      fields: [
        {
          name: 'packet before',
          exampleValue: 'dst 10.96.0.10:80',
          detail:
            'The sender addressed the Service\'s virtual IP, as resolved via DNS. This packet could never be delivered as-is — no interface owns that address.',
        },
        {
          name: 'packet after',
          exampleValue: 'dst 10.244.2.4:8080',
          detail:
            'The node\'s netfilter rules rewrote the destination to a real endpoint — Pod IP and targetPort. From here it is ordinary Pod-network routing.',
        },
        {
          name: 'endpoint choice',
          exampleValue: 'random per connection',
          detail:
            'iptables mode picks an endpoint with weighted random selection; IPVS mode supports round-robin, least-connections, and more. Either way, load spreads across the Pods.',
        },
        {
          name: 'conntrack',
          exampleValue: 'reply un-NATed',
          detail:
            'Connection tracking remembers the rewrite, so reply packets from the Pod are translated back to appear from 10.96.0.10. The client never knows a Pod was involved.',
        },
      ],
    },
  },
  {
    id: 'ingress',
    title: 'Ingress brings outside traffic in',
    accentColor: POD,
    summary:
      'ClusterIPs are only routable inside the cluster. For external HTTP(S), an Ingress defines host- and path-based routing rules, and an ingress controller (an in-cluster proxy like nginx or Envoy) receives outside traffic and forwards it to the right Service.',
    topology: {
      hiddenPods: ['web1'],
      showService: true,
      showIngress: true,
      selector: ['web2', 'web3'],
      path: ['client', 'ingress'],
    },
    message: {
      tag: 'Ingress rule',
      fields: [
        {
          name: 'host',
          exampleValue: 'shop.example.com',
          detail:
            'The controller matches the HTTP Host header, so one load-balancer IP can serve many applications on different hostnames.',
        },
        {
          name: 'path',
          exampleValue: '/',
          detail:
            'Rules can also split by URL path — /api to one Service, / to another — because Ingress operates at layer 7, unlike a Service.',
        },
        {
          name: 'backend',
          exampleValue: 'service: web · port 80',
          detail:
            'The matched request is proxied to the named Service. The controller resolves it and forwards — reusing the whole Service/endpoint machinery below.',
        },
        {
          name: 'tls',
          exampleValue: 'secretName: shop-cert',
          detail:
            'The ingress controller usually terminates TLS, using a certificate stored in a Kubernetes Secret. Inside the cluster the hop to the Pod may be plain HTTP or re-encrypted.',
        },
      ],
    },
  },
  {
    id: 'journey',
    title: 'The full journey of a request',
    accentColor: FLOW,
    summary:
      'End to end: the client hits the ingress controller, which matches shop.example.com and proxies to the web Service; kube-proxy\'s rules DNAT the ClusterIP to a ready Pod; the CNI network delivers it. Pods keep churning underneath — the path heals itself.',
    topology: {
      hiddenPods: ['web1'],
      showService: true,
      showIngress: true,
      selector: ['web2', 'web3'],
      path: ['client', 'ingress', 'svc', 'web2'],
      flow: true,
      activePods: ['web2'],
    },
    message: null,
  },
];

export default K8S_STEPS;
