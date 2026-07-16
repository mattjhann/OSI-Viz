// Stack buffer overflow — CWE-121. A fixed-size stack buffer is written past
// its bound with attacker-controlled data, overwriting adjacent stack memory —
// up to and including the saved return address — to redirect execution when
// the function returns.

const NORMAL = '#5aa9ff';
const VULN = '#ffb454';
const OVERFLOW_C = '#ff6b8b';
const HIJACK = '#c77dff';
const FIX = '#42d6a4';

// Stack grows downward; drawn top (higher address / called-later) to bottom.
const frame = (overrides = {}) => [
  { id: 's0', address: 'high', label: 'args', state: 'allocated' },
  { id: 's1', address: '', label: 'return addr', state: 'retaddr', value: '0x4011a0' },
  { id: 's2', address: '', label: 'saved RBP', state: 'retaddr', value: '0x7ffe20' },
  { id: 's3', address: '', label: 'canary', state: 'canary', value: '0xa93c…00' },
  { id: 's4', address: 'low', label: 'buf[64]', state: 'allocated', value: '(64 bytes)' },
  ...(overrides.extra ?? []),
].map((c) => ({ ...c, ...(overrides[c.id] ?? {}) }));

export const BOF_STEPS = [
  {
    id: 'call',
    title: 'A normal function call sets up its stack frame',
    accentColor: NORMAL,
    summary:
      'Calling login() pushes a new stack frame: the return address (where to resume the caller), the caller\'s saved frame pointer, and this function\'s local buffer, all sitting next to each other in memory.',
    code: [
      { id: 'c1', text: 'void login(char* username) {' },
      { id: 'c2', text: '  char buf[64];' },
      { id: 'c3', text: '  strcpy(buf, username);' },
      { id: 'c4', text: '  authenticate(buf);' },
      { id: 'c5', text: '}' },
    ],
    cells: frame({
      s4: { note: { name: 'buf[64]', detail: 'A fixed 64-byte local buffer on the stack, immediately below the frame\'s bookkeeping data.' } },
      s1: { note: { name: 'return address', detail: 'The instruction pointer to jump back to in the caller once login() returns. This is the CPU\'s only record of "where to go back to."' } },
    }),
  },
  {
    id: 'vulnerable-call',
    title: 'strcpy() has no idea how big buf is',
    accentColor: VULN,
    summary:
      'strcpy() copies until it hits a null byte in the source — it never checks the destination\'s size. If username is longer than 64 bytes, strcpy() keeps writing past the end of buf.',
    code: [
      {
        id: 'c1',
        text: 'strcpy(buf, username);  // username length is never checked',
        tone: 'danger',
        note: {
          name: 'unbounded copy',
          detail:
            'strcpy(dest, src) is defined purely in terms of src\'s null terminator. It has no parameter for dest\'s capacity, so nothing in the function signature can stop an overflow — the caller has to have bounded username beforehand, and here nobody did.',
          protocol: 'Memory',
          kind: 'vulnerable',
        },
      },
    ],
    cells: frame({
      s4: { note: { name: 'buf[64]', detail: 'Still 64 bytes of capacity — the attacker is about to send more than that.' } },
    }),
  },
  {
    id: 'overflow-begins',
    title: 'A 200-byte username starts overwriting the buffer',
    accentColor: OVERFLOW_C,
    summary:
      'The attacker sends a username far longer than 64 bytes. strcpy() fills buf completely and then keeps writing into whatever comes next on the stack — first the canary.',
    code: [
      { id: 'c1', text: 'login("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA…")  // 200 bytes' },
    ],
    cells: frame({
      s4: {
        state: 'overwritten',
        value: "'A' × 64 (full)",
        note: { name: 'buf — full, still writing', detail: 'All 64 bytes are now attacker-controlled \'A\' characters, and strcpy() has 136 more bytes of source left to copy.' },
      },
      s3: {
        state: 'overwritten',
        value: "'A' × 8 — canary corrupted",
        note: {
          name: 'canary — overwritten',
          detail: 'The stack canary is a random value the compiler places between the buffer and the saved frame pointer specifically to catch this. It has just been clobbered — the corruption is now detectable, even though execution hasn\'t hijacked anything yet.',
        },
      },
    }),
  },
  {
    id: 'overflow-hits-retaddr',
    title: 'The overflow reaches the saved return address',
    accentColor: OVERFLOW_C,
    summary:
      'With enough attacker-controlled bytes, the overflow marches past the saved frame pointer and overwrites the return address itself — the value the CPU will jump to when login() finishes.',
    code: [
      { id: 'c1', text: '// bytes 73–80 of the payload land exactly on the return address' },
    ],
    cells: frame({
      s4: { state: 'overwritten', value: "'A' × 64" },
      s3: { state: 'overwritten', value: "'A' × 8" },
      s2: { state: 'overwritten', value: "'A' × 8 — saved RBP gone" },
      s1: {
        state: 'overwritten',
        value: '0x41414141',
        note: {
          name: 'return address — overwritten',
          detail:
            'This used to be the address of the code that called login(). It now holds attacker bytes. Whatever value sits here when login() executes `ret` is where the CPU jumps next.',
        },
      },
    }),
  },
  {
    id: 'hijack',
    title: 'login() returns — into the attacker\'s address',
    accentColor: HIJACK,
    summary:
      'The `ret` instruction pops the return address off the stack and jumps to it unconditionally. If the attacker aimed those bytes at their own shellcode (or a useful gadget already in memory), execution now runs under their control.',
    code: [
      { id: 'c1', text: 'ret  // pop return address into the instruction pointer' },
      {
        id: 'c2',
        text: '// → jumps to 0x41414141, wherever the attacker pointed it',
        tone: 'danger',
        note: {
          name: 'hijacked control flow',
          detail:
            'This is the payoff of the whole bug: a data write (strcpy into an undersized buffer) turned into a control-flow transfer. Classically the attacker points this at injected shellcode; on hardened systems (NX stacks) they instead chain together existing code fragments ("gadgets") — return-oriented programming — to the same effect.',
          protocol: 'Memory',
          kind: 'exploit',
        },
      },
    ],
    cells: frame({
      s4: { state: 'overwritten', value: "'A' × 64" },
      s3: { state: 'overwritten', value: "'A' × 8" },
      s2: { state: 'overwritten', value: "'A' × 8" },
      s1: { state: 'attacker', value: '0x41414141 → shellcode' },
    }),
  },
  {
    id: 'mitigation',
    title: 'Layered defenses — bound the write, and blunt the write',
    accentColor: FIX,
    summary:
      'The real fix is bounding the copy. Everything else here is defense in depth for the bugs that slip through anyway.',
    code: [
      {
        id: 'f1',
        text: 'strlcpy(buf, username, sizeof(buf));  // or std::string — bounded by construction',
        tone: 'safe',
        note: { name: 'bounded copy', detail: 'strlcpy/snprintf (or better, a bounds-checked type like std::string) simply cannot write past the destination\'s declared size.' },
      },
      {
        id: 'f2',
        text: '// stack canary: a mismatched value before `ret` aborts the process',
        tone: 'safe',
        note: { name: 'stack canaries (-fstack-protector)', detail: 'The compiler checks the canary immediately before returning; a smashed canary means "corruption happened," and the process aborts instead of executing the hijack.' },
      },
      {
        id: 'f3',
        text: '// ASLR: stack/heap/library base addresses are randomized per run',
        tone: 'safe',
        note: { name: 'ASLR', detail: 'Even a perfect overflow needs to know an address to jump to. Randomizing memory layout per-process makes hardcoded addresses like 0x41414141 unreliable across runs.' },
      },
      {
        id: 'f4',
        text: '// NX / DEP: stack pages are marked non-executable',
        tone: 'safe',
        note: { name: 'NX / DEP', detail: 'Marking the stack non-executable stops classic shellcode-on-the-stack attacks outright — attackers must instead reuse existing executable code (ROP), which ASLR also complicates.' },
      },
    ],
    cells: frame({
      s4: { note: { name: 'buf[64]', detail: 'Bounded write — the copy stops at 64 bytes no matter how long username is.' } },
      s3: { note: { name: 'canary', detail: 'Checked on every return; a mismatch aborts before `ret` executes.' } },
    }),
  },
];

export default BOF_STEPS;
