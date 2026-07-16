// Single source of truth for the TCP connection walkthrough.
//
// Models a full connection lifetime: the three-way handshake (SYN,
// SYN-ACK, ACK), a data exchange showing how sequence/acknowledgement
// numbers count bytes, and the orderly FIN teardown.
//
// `from` is 'client' | 'server'. `states` gives each side's TCP state after
// the step, shown in the state strip. `fields` reuse the FieldDetail shape.
// Sequence numbers use small relative values (real ISNs are random 32-bit).

const OPEN = '#5aa9ff';
const ESTABLISH = '#42d6a4';
const DATA = '#7c8cff';
const CLOSE = '#ffb454';
const DONE = '#9d7bff';

export const TCP_STEPS = [
  {
    id: 'syn',
    from: 'client',
    title: 'SYN',
    accentColor: OPEN,
    summary:
      'The client opens the connection by sending a segment with the SYN flag set and a randomly chosen Initial Sequence Number. It also advertises its options — what it can do — because options can only be negotiated here.',
    states: { client: 'SYN-SENT', server: 'LISTEN' },
    fields: [
      {
        name: 'flags',
        exampleValue: 'SYN',
        detail:
          'Synchronize — "I want to open a connection and here is my starting sequence number." A SYN consumes one sequence number even though it carries no data.',
      },
      {
        name: 'seq',
        exampleValue: '1000 (ISN)',
        detail:
          'The Initial Sequence Number, chosen randomly. Randomness makes it hard for an off-path attacker to spoof segments into the connection. All the client\'s byte numbering starts from here.',
      },
      {
        name: 'MSS',
        exampleValue: '1460',
        detail:
          'Maximum Segment Size option — the largest payload the client can accept per segment, typically the link MTU (1500) minus IP and TCP headers (40).',
      },
      {
        name: 'window',
        exampleValue: '64240',
        detail:
          'Receive window: how many bytes the client can buffer. Flow control — the sender must never have more than this many unacknowledged bytes in flight.',
      },
      {
        name: 'options',
        exampleValue: 'SACK, WScale 7, Timestamps',
        detail:
          'Selective ACK lets the receiver acknowledge non-contiguous data after loss; window scaling multiplies the 16-bit window for fast networks; timestamps improve RTT measurement.',
      },
    ],
  },
  {
    id: 'synack',
    from: 'server',
    title: 'SYN-ACK',
    accentColor: OPEN,
    summary:
      'The server accepts: it acknowledges the client\'s sequence number and sends its own SYN with its own ISN. Both directions of the connection are numbered independently — this one segment does half of each handshake.',
    states: { client: 'SYN-SENT', server: 'SYN-RECEIVED' },
    fields: [
      {
        name: 'flags',
        exampleValue: 'SYN, ACK',
        detail:
          'Two jobs at once: ACK confirms the client\'s SYN arrived; SYN starts the server\'s own sequence numbering for the reverse direction.',
      },
      {
        name: 'seq',
        exampleValue: '3000 (server ISN)',
        detail:
          'The server\'s own randomly chosen Initial Sequence Number — each direction of a TCP connection counts its bytes separately.',
      },
      {
        name: 'ack',
        exampleValue: '1001',
        detail:
          'Client ISN + 1. An ACK number always means "I have received everything before this byte; send me this one next." The SYN counted as one unit.',
      },
      {
        name: 'options',
        exampleValue: 'MSS 1460, SACK, WScale 7',
        detail:
          'The server replies with its own capabilities. Only options both sides offered are used for the rest of the connection.',
      },
    ],
  },
  {
    id: 'ack',
    from: 'client',
    title: 'ACK — connection established',
    accentColor: ESTABLISH,
    summary:
      'The client acknowledges the server\'s SYN and the handshake completes — three segments, one round trip. Both sides now agree on sequence numbers and options, and either may send data.',
    states: { client: 'ESTABLISHED', server: 'ESTABLISHED' },
    fields: [
      {
        name: 'flags',
        exampleValue: 'ACK',
        detail:
          'Just an acknowledgement. From this point on, every segment in the connection carries the ACK flag.',
      },
      {
        name: 'seq',
        exampleValue: '1001',
        detail:
          'The client\'s next byte number: its ISN plus the one unit its SYN consumed. Actual data will start here.',
      },
      {
        name: 'ack',
        exampleValue: '3001',
        detail:
          'Server ISN + 1 — confirming the server\'s SYN. Both directions are now synchronized: that is the "three-way" handshake done.',
      },
      {
        name: 'why three?',
        exampleValue: 'both sides confirm both ISNs',
        detail:
          'Each side must send its ISN and hear it acknowledged. Two messages can\'t do that for both directions; three exactly suffice.',
      },
    ],
  },
  {
    id: 'data',
    from: 'client',
    title: 'Data: the request',
    accentColor: DATA,
    summary:
      'The client sends an HTTP request as TCP payload. Sequence numbers count bytes, not segments: sending 120 bytes starting at seq 1001 means the next segment will start at 1121. Lost segments are detected and retransmitted using these numbers.',
    states: { client: 'ESTABLISHED', server: 'ESTABLISHED' },
    fields: [
      {
        name: 'flags',
        exampleValue: 'PSH, ACK',
        detail:
          'PSH asks the receiver to deliver the data to the application promptly rather than waiting to fill a buffer. ACK is ever-present after the handshake.',
      },
      {
        name: 'seq',
        exampleValue: '1001',
        detail:
          'This segment\'s payload starts at byte 1001 of the client→server stream. The receiver uses this to reassemble data in order, even if segments arrive shuffled.',
      },
      {
        name: 'len',
        exampleValue: '120 bytes',
        detail:
          'The payload — say, "GET / HTTP/1.1…". It occupies bytes 1001–1120, so the client\'s next segment will carry seq 1121.',
      },
      {
        name: 'reliability',
        exampleValue: 'retransmit on timeout / dup-ACKs',
        detail:
          'If no ACK covering these bytes arrives in time — or duplicate ACKs signal a gap — the sender retransmits. This is how TCP builds a reliable stream on an unreliable network.',
      },
    ],
  },
  {
    id: 'response',
    from: 'server',
    title: 'Data: the response',
    accentColor: DATA,
    summary:
      'The server acknowledges the request\'s 120 bytes and streams back the response on its own sequence numbering. ACKs are cumulative — one number confirms everything received so far — and usually ride along on data segments for free.',
    states: { client: 'ESTABLISHED', server: 'ESTABLISHED' },
    fields: [
      {
        name: 'flags',
        exampleValue: 'PSH, ACK',
        detail:
          'Data and acknowledgement travel together — TCP piggybacks ACKs on whatever is being sent anyway.',
      },
      {
        name: 'ack',
        exampleValue: '1121',
        detail:
          '1001 + 120: "I have all your bytes up to 1120, send 1121 next." One cumulative number acknowledges the entire request.',
      },
      {
        name: 'seq',
        exampleValue: '3001',
        detail:
          'The response occupies the server→client stream starting here — numbered completely independently of the client\'s direction.',
      },
      {
        name: 'window update',
        exampleValue: '65535 → grows',
        detail:
          'Each segment re-advertises how much buffer the receiver has free. Meanwhile congestion control (slow start, cubic…) separately limits the sender based on network capacity.',
      },
    ],
  },
  {
    id: 'fin',
    from: 'client',
    title: 'FIN — closing our half',
    accentColor: CLOSE,
    summary:
      'Done sending, the client sends FIN: "no more data from me." A FIN closes only its sender\'s direction — the connection is now half-closed, and the server could keep sending for as long as it needs.',
    states: { client: 'FIN-WAIT-1', server: 'CLOSE-WAIT' },
    fields: [
      {
        name: 'flags',
        exampleValue: 'FIN, ACK',
        detail:
          'Finish — the sender\'s byte stream ends here. Like SYN, a FIN consumes one sequence number so it can itself be acknowledged.',
      },
      {
        name: 'seq',
        exampleValue: '1121',
        detail:
          'The FIN sits right after the last data byte the client sent. The server will acknowledge it with ack 1122.',
      },
      {
        name: 'half-close',
        exampleValue: 'client → server stream only',
        detail:
          'Each direction shuts independently. The server enters CLOSE-WAIT: it knows the client is done talking, but may still finish sending its own data.',
      },
    ],
  },
  {
    id: 'close',
    from: 'server',
    title: 'FIN-ACK — fully closed',
    accentColor: DONE,
    summary:
      'The server ACKs the client\'s FIN and, when it too is done, sends its own FIN; the client ACKs it back. The client then lingers in TIME-WAIT (~60s) so stray delayed segments can\'t corrupt a future connection reusing the same ports.',
    states: { client: 'TIME-WAIT', server: 'CLOSED' },
    fields: [
      {
        name: 'flags',
        exampleValue: 'FIN, ACK',
        detail:
          'The server\'s own FIN, with ack 1122 confirming the client\'s. The client answers with a final ACK — four segments in the full teardown.',
      },
      {
        name: 'ack',
        exampleValue: '1122',
        detail:
          'Acknowledges the client\'s FIN (seq 1121, one unit). Both byte streams are now complete and confirmed.',
      },
      {
        name: 'TIME-WAIT',
        exampleValue: '2 × MSL ≈ 60 s',
        detail:
          'Whoever closes first waits two Maximum Segment Lifetimes before forgetting the connection — long enough for any delayed duplicate segments to expire, so they can\'t be mistaken for part of a new connection on the same 4-tuple.',
      },
      {
        name: 'the 4-tuple',
        exampleValue: 'src IP:port ↔ dst IP:port',
        detail:
          'What identified this connection all along. Every segment in the exchange carried the same four values — that is how the OS demultiplexes packets to the right socket.',
      },
    ],
  },
];

export default TCP_STEPS;
