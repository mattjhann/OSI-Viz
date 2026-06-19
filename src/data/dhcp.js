// Single source of truth for the DHCP lease walkthrough.
//
// Models the DORA exchange: a new client joining a network broadcasts a
// Discover, a DHCP server responds with an Offer, the client formally
// Requests, and the server Acknowledges — granting an IP lease.
//
// `from`/`to` reference entries in ACTORS. `broadcast` marks messages sent
// to ff:ff:ff:ff:ff:ff (the whole LAN). `fields` reuse the shape consumed
// by FieldDetail: { name, exampleValue, detail }.

const CLIENT = '#7c8cff';
const SERVER = '#42d6a4';
const BROADCAST = '#ffb454';
const CONFIRM = '#9d7bff';

export const ACTORS = [
  { id: 'client', label: 'Client', sublabel: '(no IP yet)' },
  { id: 'switch', label: 'Switch / LAN', sublabel: 'broadcast domain' },
  { id: 'server', label: 'DHCP Server', sublabel: '192.168.1.1' },
];

export const DHCP_STEPS = [
  {
    id: 'discover',
    from: 'client',
    to: 'server',
    broadcast: true,
    accentColor: BROADCAST,
    title: 'DHCP Discover',
    phase: 'D',
    summary:
      'The client has no IP address yet, so it broadcasts a Discover to the entire LAN: "Is there a DHCP server out there?" Every device on the segment receives the frame, but only DHCP servers respond.',
    fields: [
      {
        name: 'op',
        exampleValue: '1 (BOOTREQUEST)',
        detail:
          'Operation code 1 means this is a request from a client. The server will reply with op 2 (BOOTREPLY).',
      },
      {
        name: 'xid',
        exampleValue: '0x3903F326',
        detail:
          'Transaction ID — a random 32-bit number the client picks. All four DORA messages carry the same xid so the client can match replies to its request, even if multiple exchanges are in-flight.',
      },
      {
        name: 'ciaddr',
        exampleValue: '0.0.0.0',
        detail:
          'Client IP address. Zero because the client does not have one yet — the whole point of this exchange.',
      },
      {
        name: 'chaddr',
        exampleValue: 'AA:BB:CC:DD:EE:01',
        detail:
          'The client\'s hardware (MAC) address. The server uses it to identify the client and may bind a lease to it.',
      },
      {
        name: 'Dest IP',
        exampleValue: '255.255.255.255',
        detail:
          'The limited broadcast address. Since the client has no IP, it cannot target a specific server — so the message is sent to every host on the local network.',
      },
      {
        name: 'Option 53',
        exampleValue: 'DHCPDISCOVER',
        detail:
          'DHCP Message Type. This option distinguishes the four DORA messages. Here it says "Discover" — the client is looking for servers.',
      },
      {
        name: 'Option 55',
        exampleValue: 'Subnet, Router, DNS, Lease Time',
        detail:
          'Parameter Request List. The client tells the server which configuration parameters it would like (subnet mask, default gateway, DNS server, etc.).',
      },
    ],
  },
  {
    id: 'offer',
    from: 'server',
    to: 'client',
    broadcast: true,
    accentColor: SERVER,
    title: 'DHCP Offer',
    phase: 'O',
    summary:
      'A DHCP server responds with an Offer containing an available IP address and configuration. If multiple servers exist, the client may receive several Offers and choose one.',
    fields: [
      {
        name: 'op',
        exampleValue: '2 (BOOTREPLY)',
        detail:
          'Operation code 2 — a reply from the server.',
      },
      {
        name: 'xid',
        exampleValue: '0x3903F326',
        detail:
          'Same transaction ID as the Discover, so the client knows this Offer is a response to its request.',
      },
      {
        name: 'yiaddr',
        exampleValue: '192.168.1.50',
        detail:
          '"Your" IP address — the address the server is offering to the client. It is reserved (not yet committed) until the client formally requests it.',
      },
      {
        name: 'siaddr',
        exampleValue: '192.168.1.1',
        detail:
          'Server IP address. Identifies which DHCP server sent this Offer.',
      },
      {
        name: 'Option 53',
        exampleValue: 'DHCPOFFER',
        detail:
          'Message type Offer — the server is proposing a lease, not confirming one yet.',
      },
      {
        name: 'Option 51',
        exampleValue: '86400 (24 hours)',
        detail:
          'IP Address Lease Time — how long the client may use the address before it must renew. When the lease expires without renewal, the address returns to the pool.',
      },
      {
        name: 'Option 1',
        exampleValue: '255.255.255.0',
        detail:
          'Subnet Mask. Tells the client the size of the local network so it knows which addresses are on-link vs. requiring a router.',
      },
      {
        name: 'Option 3',
        exampleValue: '192.168.1.1',
        detail:
          'Router (default gateway). The IP address the client should forward traffic to when the destination is not on the local subnet.',
      },
      {
        name: 'Option 6',
        exampleValue: '8.8.8.8, 1.1.1.1',
        detail:
          'DNS servers the client should use for name resolution.',
      },
    ],
  },
  {
    id: 'request',
    from: 'client',
    to: 'server',
    broadcast: true,
    accentColor: CONFIRM,
    title: 'DHCP Request',
    phase: 'R',
    summary:
      'The client chooses one Offer and broadcasts a Request for it. Broadcasting (rather than unicasting) lets any other servers that made Offers know they were not chosen, so they can release their reserved addresses.',
    fields: [
      {
        name: 'op',
        exampleValue: '1 (BOOTREQUEST)',
        detail:
          'Still a client request (op 1) — the client is formally asking the server to commit the offered address.',
      },
      {
        name: 'xid',
        exampleValue: '0x3903F326',
        detail:
          'Same transaction ID, tying this Request back to the original Discover/Offer exchange.',
      },
      {
        name: 'ciaddr',
        exampleValue: '0.0.0.0',
        detail:
          'Still 0.0.0.0 — the client does not use the offered IP until the server confirms with an Ack.',
      },
      {
        name: 'Dest IP',
        exampleValue: '255.255.255.255',
        detail:
          'Still broadcast. Even though the client has picked a server, broadcasting the Request lets all other servers see the choice and withdraw their Offers.',
      },
      {
        name: 'Option 53',
        exampleValue: 'DHCPREQUEST',
        detail:
          'Message type Request — the client is formally accepting one specific Offer.',
      },
      {
        name: 'Option 50',
        exampleValue: '192.168.1.50',
        detail:
          'Requested IP Address — the address from the chosen Offer. The client is saying "I want this one."',
      },
      {
        name: 'Option 54',
        exampleValue: '192.168.1.1',
        detail:
          'Server Identifier — the IP of the chosen DHCP server, so all servers know which Offer was accepted.',
      },
    ],
  },
  {
    id: 'ack',
    from: 'server',
    to: 'client',
    broadcast: false,
    accentColor: SERVER,
    title: 'DHCP Ack',
    phase: 'A',
    summary:
      'The server commits the lease and sends an Acknowledgement with the final configuration. The client binds the IP to its interface — it is now a full participant on the network.',
    fields: [
      {
        name: 'op',
        exampleValue: '2 (BOOTREPLY)',
        detail:
          'Server reply confirming the lease.',
      },
      {
        name: 'xid',
        exampleValue: '0x3903F326',
        detail:
          'Transaction ID matches throughout. The four-message exchange is complete.',
      },
      {
        name: 'yiaddr',
        exampleValue: '192.168.1.50',
        detail:
          'The now-committed IP address. After receiving this Ack, the client configures its network interface with this address.',
      },
      {
        name: 'Option 53',
        exampleValue: 'DHCPACK',
        detail:
          'Message type Ack — the server confirms the lease is active. If something went wrong, this would be a DHCPNAK instead.',
      },
      {
        name: 'Option 51',
        exampleValue: '86400 (24 hours)',
        detail:
          'The committed lease time. The client starts a renewal timer (typically at 50% of the lease) and a rebinding timer (at 87.5%).',
      },
      {
        name: 'Option 1',
        exampleValue: '255.255.255.0',
        detail:
          'Subnet mask — repeated in the Ack as the authoritative value the client should use.',
      },
      {
        name: 'Option 3',
        exampleValue: '192.168.1.1',
        detail:
          'Default gateway, confirmed.',
      },
      {
        name: 'Option 6',
        exampleValue: '8.8.8.8, 1.1.1.1',
        detail:
          'DNS servers, confirmed. The client can now resolve domain names.',
      },
    ],
  },
  {
    id: 'bound',
    from: 'client',
    to: 'client',
    broadcast: false,
    accentColor: CLIENT,
    title: 'Bound',
    phase: 'done',
    summary:
      'The client applies the IP address, subnet mask, gateway, and DNS servers to its network interface. It is now fully configured and can communicate on the network. At 50% of the lease time it will attempt to renew directly with the server — no broadcast needed.',
    fields: [
      {
        name: 'IP address',
        exampleValue: '192.168.1.50',
        detail:
          'The leased IP address, now active on the client\'s network interface.',
      },
      {
        name: 'Subnet mask',
        exampleValue: '255.255.255.0',
        detail:
          'Defines the local network boundary. Addresses inside the mask are on-link; everything else goes via the gateway.',
      },
      {
        name: 'Default gateway',
        exampleValue: '192.168.1.1',
        detail:
          'The router the client forwards off-subnet traffic to.',
      },
      {
        name: 'DNS servers',
        exampleValue: '8.8.8.8, 1.1.1.1',
        detail:
          'The resolvers the client uses for DNS lookups.',
      },
      {
        name: 'Lease expires',
        exampleValue: 'T + 24 hours',
        detail:
          'The client must renew before this time or lose the address. Renewal (unicast to the server) is attempted at T+12h; rebinding (broadcast) at T+21h if renewal fails.',
      },
    ],
  },
];

export default DHCP_STEPS;
