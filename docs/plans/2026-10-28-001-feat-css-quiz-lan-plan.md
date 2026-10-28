---
title: 35-Item CSS Quiz, LAN-Hosted
type: feat
status: completed
date: 2026-10-28
---

# 35-Item CSS Quiz, LAN-Hosted

## Overview

Build a self-contained, 35-question multiple-choice quiz about CSS, delivered as a single static HTML file (`ft_quiz.html`, currently empty). Host it on the local network so other devices on the same WiFi/router can open it in a browser via the host machine's local IP address — no internet deployment, no backend, no database.

## Problem Frame

User wants a classroom/group-style quiz: one person (host) runs it from their machine, other participants join over the same local network using the host's IP + port in their browser. Each participant answers 35 CSS questions and sees their own score at the end. No cross-device score collection is required.

## Requirements Trace

- R1. Quiz contains exactly 35 multiple-choice questions covering CSS topics.
- R2. Each question has 4 answer options with exactly one correct answer.
- R3. Taker can navigate through questions and submit answers.
- R4. On completion, taker sees their score (e.g. X/35) and can review which answers were right/wrong.
- R5. Quiz is reachable from other devices on the same local network via the host's local IP address and a port — not via `file://` (which only works on the host machine).
- R6. No internet-facing hosting, no backend server logic, no persistent storage of results.

## Scope Boundaries

- No public/internet deployment (GitHub Pages, Netlify, Vercel, etc.) — explicitly out of scope per user decision.
- No backend, API, or database — no server-side score collection or host-side results dashboard.
- No user accounts, login, or identity tracking of takers.
- No question randomization/shuffling logic beyond a fixed order (see Open Questions — deferred).
- No automated test suite — this repo has no existing test tooling; verification is manual (see Test Scenarios per unit).

## Context & Research

### Relevant Code and Patterns

- `ft_quiz.html` — existing target file, currently 0 bytes. No prior quiz markup, CSS, or JS exists to reuse. No other files exist in this project directory.
- No local patterns found for quiz UI, question data shape, or static-file LAN hosting in this repo — greenfield build.

### Institutional Learnings

- None found applicable (no `docs/solutions/` entries relevant to static quiz pages or LAN hosting in this project).

### External References

- Not used. This is a plain static HTML/CSS/JS page with no security, payment, or auth surface, and the user already knows the intended shape (single file, LAN-served). External research would add negligible value here.

## Key Technical Decisions

- **Single self-contained HTML file** (`ft_quiz.html`) with inline `<style>` and `<script>`: Decision avoids a build step, bundler, or dependency install — the simplest thing that can be opened by a static file server and is trivial to host/copy/share.
- **Client-side only, no backend**: Matches confirmed requirement that each taker only needs their own score; avoids the complexity (server process, storage, concurrency) of collecting results.
- **Serve via a plain static HTTP server bound to all interfaces (`0.0.0.0`), not opened as `file://`**: `file://` only renders locally and cannot be reached by other devices; a bound HTTP server on the host's LAN IP is required for R5.
- **Prefer tooling already likely present (Python's built-in `http.server`) as the primary hosting instruction**, with an alternative (`npx serve`) noted for hosts without Python: minimizes new install requirements for the host.
- **Question data as an in-page JS array of objects** (`{ question, options: [4 strings], correctIndex }`): keeps authoring and scoring logic simple and framework-free.
- **Fixed question order (no shuffle) for v1**: simplest to implement and verify; shuffling is noted as a deferred enhancement, not required by current scope.

## Open Questions

### Resolved During Planning

- Hosting model: LAN-only via host's local IP, not public internet (user-confirmed).
- Results tracking: each taker sees only their own score; no host-side collection (user-confirmed).

### Deferred to Implementation

- Exact wording/phrasing of each of the 35 questions and their 4 answer options — content to be authored during implementation against the topic coverage breakdown in Unit 1, not pre-written here.
- Whether to randomize question/option order per taker — not required by current scope; implementer may add if trivial, but it is not a blocking decision.
- Exact port number for the local server (e.g. 8000 vs 5500) — cosmetic, implementer's choice, should just be stated clearly in the hosting instructions.

## Implementation Units

- [x] **Unit 1: CSS Question Bank (35 items)**

**Goal:** Author the 35 multiple-choice CSS questions as structured data, covering a representative spread of CSS topics so the quiz is substantive rather than repetitive.

**Requirements:** R1, R2

**Dependencies:** None

**Files:**
- Modify: `ft_quiz.html` (question data embedded in a `<script>` block)

**Approach:**
- Represent each question as `{ question: string, options: [string, string, string, string], correctIndex: 0-3 }` in a JS array named e.g. `QUESTIONS`.
- Distribute the 35 questions across exactly the topics covered by the course's "CSS Style Lab" reference page, so no single topic dominates and nothing outside the taught syllabus (e.g. flexbox, grid, transitions, media queries) is tested:
  - Selectors & specificity (type/class/ID selectors, child combinator, specificity scoring, tie-breaking, `!important`) — 7
  - Fonts, backgrounds, borders (font-family/em, text-decoration/text-align, background-image/background-repeat, border-style shading) — 7
  - The box model (padding vs. margin, box-sizing math, margin shorthand, centering with margin) — 6
  - Positioning & z-index (`static`/`relative`/`absolute`/`fixed`, positioned-ancestor anchoring, `z-index` stacking) — 6
  - Float & clear (text wrap, `clear: both`, container collapse, the overflow fix) — 4
  - Display, visibility & overflow (`display` values, `display: none` vs. `visibility: hidden` vs. `opacity: 0`, `overflow: auto`, `white-space: nowrap`) — 5
- Keep each question's distractors plausible (no obviously-wrong filler options) so the quiz has real difficulty.

**Patterns to follow:**
- None locally available (greenfield); keep the data shape flat and framework-free so Unit 2 can consume it directly.

**Test scenarios:**
- Happy path: `QUESTIONS.length === 35`.
- Happy path: every question object has exactly 4 non-empty `options` and a `correctIndex` in range `0-3`.
- Edge case: no two options within the same question are identical strings (prevents an unanswerable/ambiguous question).
- Edge case: topic spread roughly matches the breakdown above (manual spot-check, not exact enforcement).
- Edge case: an independent correctness pass over all 35 questions (re-reading each against CSS spec/reference, by the author or a second reviewer) confirms each `correctIndex` is the single defensible correct answer with no disputable edge case (e.g. specificity ties, shorthand overlap) — structural checks above don't catch a wrong-but-well-formed answer key.

**Verification:**
- Opening the page and clicking through all 35 questions shows no blank/malformed question or missing option.
- The independent correctness pass above is completed with no unresolved disputes before the quiz is considered content-complete.

- [x] **Unit 2: Quiz Engine (navigation, scoring, results)**

**Goal:** Implement the in-browser logic that presents one question at a time (or all at once — implementer's layout choice), captures the taker's selected answers, computes a score out of 35 on submission, and shows a results screen with correct/incorrect breakdown.

**Requirements:** R3, R4

**Dependencies:** Unit 1 (reads `QUESTIONS`)

**Files:**
- Modify: `ft_quiz.html` (quiz logic in the same `<script>` block)

**Approach:**
- One question at a time, with Next/Previous navigation and a "Question N of 35" counter (this is the layout model Unit 3's progress indicator assumes — committing to it here removes the ambiguity between a one-at-a-time vs. all-at-once layout).
- Render each question with its 4 options as selectable inputs (radio buttons grouped per question). Taker can navigate back via Previous and change a prior answer before submitting.
- Track the taker's selected option index per question in memory (plain JS object/array keyed by question index); no `localStorage`/persistence needed since results aren't collected across sessions.
- On "Submit"/"Finish", compare each selected index to `correctIndex`, sum correct answers, and render a results view: `Score: X / 35`, plus a per-question list showing the taker's answer vs. the correct answer.
- Block submission if any question is unanswered: show an inline list of the unanswered question numbers and keep the taker on the quiz until all 35 are answered. This gives a clear, visible rule instead of silently scoring blanks as wrong.
- Results screen includes a "Retake Quiz" button that clears in-memory answers and re-renders from question 1 — needed since a shared LAN link may be reused by multiple takers in sequence (e.g. a shared classroom device) without a page reload.

**Technical design:** *(directional guidance for review, not implementation specification)*

```
on submit:
  score = 0
  for each question i in QUESTIONS:
    if takerAnswers[i] === QUESTIONS[i].correctIndex:
      score += 1
  render results(score, 35, perQuestionBreakdown)
```

**Patterns to follow:**
- None locally available (greenfield).

**Test scenarios:**
- Happy path: answering all 35 questions correctly shows `Score: 35 / 35`.
- Happy path: answering all 35 incorrectly shows `Score: 0 / 35`.
- Happy path: a mixed set of correct/incorrect answers produces the matching score (e.g. 20 correct -> `20 / 35`).
- Edge case: submitting with one or more questions unanswered is blocked and the specific unanswered question numbers are shown to the taker, not silently scored.
- Edge case: changing a previously-selected answer (including after navigating back via Previous) before submitting updates the stored answer (last selection wins), not both.
- Edge case: results view correctly flags which specific questions were wrong when reviewed (per-question breakdown matches actual selections).
- Edge case: clicking "Retake Quiz" on the results screen clears all prior answers and restarts cleanly at question 1 (no leftover state from the previous attempt).

**Verification:**
- Manually completing the quiz with a known pattern of correct/incorrect answers produces the exact expected score and a results breakdown that matches those choices.

- [x] **Unit 3: Page Styling & Layout**

**Goal:** Make the quiz usable and legible — clear question/option layout, visible progress (e.g. "Question 4 of 35"), a readable results screen, and basic responsiveness so it's usable on phone-sized screens (since LAN participants will likely use varied devices).

**Requirements:** R3, R4

**Dependencies:** Unit 2 (styles target the rendered quiz/results markup)

**Files:**
- Modify: `ft_quiz.html` (inline `<style>` block)

**Approach:**
- Inline CSS only (no external stylesheet, no CDN) to keep the file fully self-contained for simple hosting/sharing.
- Include `<meta name="viewport" content="width=device-width, initial-scale=1">` in `<head>` — without it, phone browsers render at a ~980px virtual viewport and the responsive CSS below won't actually engage.
- Responsive layout (single column, readable font sizes, tappable option targets) down to common phone widths (~360-400px).
- Visual distinction for correct vs. incorrect answers on the results screen: pair the color coding with a text or icon cue (e.g. a checkmark/✗ or "Correct"/"Incorrect" label) so the distinction isn't color-only (unreadable for colorblind takers).

**Patterns to follow:**
- None locally available (greenfield).

**Test scenarios:**
- Test expectation: none -- pure styling change with no behavioral logic; verified visually (manual check at desktop and phone-emulated widths), not via test scenarios.

**Verification:**
- Page renders cleanly and all controls remain usable/tappable at both a typical desktop width and a ~375px-wide phone viewport.

- [x] **Unit 4: LAN Hosting Instructions**

**Goal:** Document exactly how the host runs a local static server bound to the network and how participants connect from their own devices — this is the piece that satisfies "same IP address" access.

**Requirements:** R5, R6

**Dependencies:** Units 1-3 (file must be complete to usefully serve)

**Files:**
- Create: `README.md` (hosting instructions) — or a short section at the top of this plan's companion doc if the user prefers not to add a README; implementer's call on exact file name/location, content is what matters.

**Approach:**
- Primary instructions: from the folder containing `ft_quiz.html`, run a static server, e.g. Python's built-in server (`python -m http.server 8000`) — ubiquitous, no install needed on most systems. Python's `http.server` already binds to all interfaces by default (confirmed via `python -m http.server --help`: "bind to this address (default: all interfaces)"), so no extra `--bind` flag is needed.
- Explain how the host finds their own LAN IP address (`ipconfig` on Windows, looking for the IPv4 address on the active WiFi/Ethernet adapter).
- Explain that participants on the **same WiFi/router** open `http://<host-LAN-IP>:8000/ft_quiz.html` in their browser.
- Require a live connectivity dry-run before the real session: host loads the page from a second device on the actual network that will be used. Some classroom/office WiFi enables AP/client isolation (devices can reach the internet but not each other) — the only way to know if this blocks the quiz is to test on the real network beforehand, not assume. If the dry-run fails, document a fallback: host creates a personal mobile hotspot and has participants join that network instead.
- Note the two realistic failure modes: (1) the host OS's native firewall may prompt to allow the connection on first run — must be allowed for LAN access to work (expected, not a bug); (2) if no firewall prompt appears but the connection still fails, check for third-party antivirus/security software, which can silently block inbound connections without any visible prompt.
- Alternative instruction path (`npx serve -l 8000`) for hosts without Python installed — note this requires Node.js/npm to already be installed, and the first run of `npx serve` may need a working internet connection to fetch the package (subsequent runs can work offline once cached).

**Test scenarios:**
- Happy path: following the documented steps, a second device on the same WiFi network successfully loads the quiz via `http://<host-LAN-IP>:8000/ft_quiz.html`.
- Edge case: a device on a *different* network (e.g. mobile data, different WiFi) correctly cannot reach the address — confirms it's LAN-only as intended, not an accidental public exposure.
- Error path: if the host's firewall blocks the port, the documented instructions call out the firewall prompt so the host knows to allow it rather than assuming the quiz is broken.

**Verification:**
- A second physical device on the same network loads and completes the quiz end-to-end using only the README's instructions, with no steps missing or assumed.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Host's OS firewall or third-party antivirus silently blocks the server port, taker sees "can't connect" | Unit 4 documents both the native-firewall prompt and the silent third-party-antivirus case as expected steps to check |
| Classroom/office WiFi enables AP/client isolation so devices can't reach each other even though they share a router | Unit 4 requires a live dry-run on the actual network before the real session, with a mobile-hotspot fallback if isolation blocks it |
| 35 questions authored with ambiguous or multiple plausible-correct options, or a flat-out wrong `correctIndex` | Unit 1 test scenarios require non-duplicate, unambiguous distractors plus an independent correctness pass over all 35 answer keys before content is considered complete |

## Sources & References

- Target file: `ft_quiz.html`
