// Use-after-free — CWE-416. A dangling pointer keeps referencing heap memory
// after it's freed; if the allocator hands that same address to something else
// before the dangling pointer is used again, the original code ends up reading
// (or calling through) attacker-controlled data.

const ALLOC = '#5aa9ff';
const FREE_C = '#ffb454';
const DANGLE = '#ff6b8b';
const ATTACK = '#c77dff';
const FIX = '#42d6a4';

const baseHeap = (overrides = {}) => [
  { id: 'h0', address: '0x1000', label: 'header', state: 'empty' },
  { id: 'h1', address: '0x1010', label: 'other obj', state: 'allocated' },
  { id: 'h2', address: '0x1040', label: 'Widget', state: 'empty' },
  { id: 'h3', address: '0x1070', label: 'header', state: 'empty' },
  ...overrides.extra ?? [],
].map((c) => ({ ...c, ...(overrides[c.id] ?? {}) }));

export const UAF_STEPS = [
  {
    id: 'allocate',
    title: 'A Widget is allocated on the heap',
    accentColor: ALLOC,
    summary:
      'The program asks the allocator for memory, constructs a Widget in it, and keeps a pointer, p, to that address.',
    code: [
      { id: 'c1', text: 'Widget* p = new Widget("Save");' },
      {
        id: 'c2',
        text: '// p → 0x1040',
        note: {
          name: 'live pointer',
          detail:
            'p now holds the address of a live, valid object. Every read or method call through p is well-defined.',
          protocol: 'Memory',
          kind: 'allocated',
        },
      },
    ],
    cells: baseHeap({
      h2: {
        state: 'allocated',
        label: 'Widget',
        value: 'vtable → Widget::onClick',
        note: {
          name: '0x1040 — Widget object',
          detail: 'Holds the Widget\'s vtable pointer (which function runs when p->onClick() is called) and its fields.',
        },
      },
    }),
    activePointer: { id: 'p', label: 'p', target: 'h2' },
  },
  {
    id: 'use',
    title: 'The program uses it normally',
    accentColor: ALLOC,
    summary:
      'Business as usual — p is dereferenced to call a method. Nothing unsafe yet; the object backing p is still alive.',
    code: [
      { id: 'c1', text: 'p->render();' },
      { id: 'c2', text: 'ui.registerCallback(p);  // a second reference is stashed away' },
    ],
    cells: baseHeap({
      h2: {
        state: 'allocated',
        label: 'Widget',
        value: 'vtable → Widget::onClick',
      },
    }),
    activePointer: { id: 'p', label: 'p', target: 'h2' },
  },
  {
    id: 'free',
    title: 'The Widget is freed — but a reference survives',
    accentColor: FREE_C,
    summary:
      'The owning code deletes the Widget, believing it\'s done with it. It forgot about the callback registered in the previous step: that pointer is now dangling.',
    code: [
      { id: 'c1', text: 'delete p;' },
      {
        id: 'c2',
        text: '// p still holds 0x1040 — nothing clears it',
        tone: 'danger',
        note: {
          name: 'dangling pointer',
          detail:
            'delete frees the memory back to the allocator but does not (and cannot) change every variable that happened to hold that address. p — and the copy stashed in ui\'s callback list — still point at 0x1040. The memory there is now undefined: reading it is a bug even if it "looks" fine.',
          protocol: 'Memory',
          kind: 'dangling',
        },
      },
    ],
    cells: baseHeap({
      h2: {
        state: 'freed',
        label: 'freed',
        value: '(contents undefined)',
        note: {
          name: '0x1040 — freed',
          detail: 'The allocator now considers this address available. Its previous contents may still be sitting there byte-for-byte, or may already be gone — that\'s exactly the ambiguity the bug relies on.',
        },
      },
    }),
    activePointer: { id: 'p', label: 'p (dangling)', target: 'h2', dangling: true },
  },
  {
    id: 'reallocate',
    title: 'An attacker-controlled object reuses the same slot',
    accentColor: ATTACK,
    summary:
      'Allocators reuse freed slots for the next allocation of a similar size — that\'s the whole point of an allocator. If the attacker can trigger an allocation of attacker-controlled data right now, it lands exactly where the Widget used to live.',
    code: [
      { id: 'c1', text: 'auto* evil = new AttackerBuffer(attacker_input);' },
      {
        id: 'c2',
        text: '// evil happens to land at 0x1040 — the freed Widget\'s old address',
        tone: 'danger',
        note: {
          name: 'heap grooming',
          detail:
            'Real exploits often "groom" the heap first — free and allocate objects in a specific pattern — to make this reuse reliable rather than lucky. Here it\'s shown as a direct hit for clarity.',
          protocol: 'Memory',
          kind: 'attacker',
        },
      },
    ],
    cells: baseHeap({
      h2: {
        state: 'attacker',
        label: 'AttackerBuffer',
        value: 'fake vtable → shellcode()',
        note: {
          name: '0x1040 — attacker data',
          detail:
            'The bytes at this address are now fully attacker-controlled — including, if the attacker knows the Widget\'s memory layout, a forged vtable pointer sitting exactly where Widget::onClick used to be.',
        },
      },
    }),
    activePointer: { id: 'p', label: 'p (dangling)', target: 'h2', dangling: true },
  },
  {
    id: 'use-after-free',
    title: 'The stale callback fires — through attacker data',
    accentColor: DANGLE,
    summary:
      'The UI event loop finally invokes the callback it registered two steps ago. It has no idea the object underneath was freed and replaced — it just calls through the pointer it was given.',
    code: [
      { id: 'c1', text: 'p->onClick();  // p still points at 0x1040' },
      {
        id: 'c2',
        text: '// → reads the vtable AT 0x1040 → jumps to attacker\'s "shellcode()"',
        tone: 'danger',
        note: {
          name: 'use-after-free → hijacked control flow',
          detail:
            'onClick() is a virtual call: the CPU reads a function pointer out of the object\'s memory and jumps to it. Since that memory is now the attacker\'s buffer, the "function" it jumps to is whatever address the attacker put there.',
          protocol: 'Memory',
          kind: 'exploit',
        },
      },
    ],
    cells: baseHeap({
      h2: {
        state: 'attacker',
        label: 'AttackerBuffer',
        value: 'vtable → shellcode()',
      },
    }),
    activePointer: { id: 'p', label: 'p → hijacked', target: 'h2', dangling: true, firing: true },
  },
  {
    id: 'mitigation',
    title: 'Fix: destroy ownership ambiguity, not just this bug',
    accentColor: FIX,
    summary:
      'The root cause is that two things believed they owned p\'s lifetime. Modern C++ and hardened allocators close this class of bug rather than patching one instance of it.',
    code: [
      {
        id: 'f1',
        text: 'std::shared_ptr<Widget> p = std::make_shared<Widget>("Save");',
        tone: 'safe',
        note: {
          name: 'ownership types',
          detail:
            'shared_ptr/unique_ptr make lifetime explicit: the object is only freed once nothing references it, so a stashed callback keeps it alive instead of dangling.',
          protocol: 'Memory',
          kind: 'fix',
        },
      },
      {
        id: 'f2',
        text: 'delete p; p = nullptr;',
        tone: 'safe',
        note: {
          name: 'null after free',
          detail:
            'Cheap and not foolproof (it only clears this one variable), but it turns many use-after-free bugs into immediate, loud null-pointer crashes instead of silent exploitation.',
          protocol: 'Memory',
          kind: 'fix',
        },
      },
      {
        id: 'f3',
        text: '// AddressSanitizer / hardened allocators poison freed memory\n// and quarantine addresses before reuse',
        tone: 'safe',
        note: {
          name: 'tooling & allocator hardening',
          detail:
            'ASan and hardened allocators (e.g. GWP-ASan, PartitionAlloc) detect or delay reuse of freed addresses, turning use-after-free into a crash you catch in testing rather than a working exploit in production.',
          protocol: 'Memory',
          kind: 'fix',
        },
      },
    ],
    cells: baseHeap({
      h2: {
        state: 'freed',
        label: 'poisoned',
        value: '(quarantined by allocator)',
        note: {
          name: '0x1040 — quarantined',
          detail: 'A hardened allocator won\'t hand this address back out for a while (or ever, for that allocation size), so a stray dangling pointer finds poisoned memory instead of live attacker data.',
        },
      },
    }),
    activePointer: { id: 'p', label: 'p = nullptr', target: null },
  },
];

export default UAF_STEPS;
