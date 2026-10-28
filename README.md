# CSS Quiz — LAN Hosting

A 38-question CSS quiz (`ft_quiz.html`) — 35 multiple-choice plus 3 code-writing items where the student types real CSS. Each student enters their name before starting. Hosted on your local network only (no public internet, no cloud).

Results (name, score, every answer) are saved to a small local database on the host's own PC via `server.js`, so the teacher can review them afterward on `results.html` — nothing leaves the LAN, nothing is sent to any third-party service.

## 1. Requirement: Node.js

Unlike earlier static-only setups, this now needs **Node.js** (not just Python) — `server.js` is what saves student results, and a plain static file server (like `python -m http.server`) can't do that. If you don't have Node, install it from [nodejs.org](https://nodejs.org) (any recent LTS version works). No `npm install` is needed — `server.js` uses only Node's built-in modules.

## 2. Host: start the server

From this folder (the one containing `ft_quiz.html` and `server.js`), run:

```
node server.js
```

You should see:

```
CSS Quiz server running.
  Local:   http://127.0.0.1:8000/ft_quiz.html
  Results: http://127.0.0.1:8000/results.html
  Results are stored in: ...\data\results.json
```

It binds to all network interfaces by default, so other devices on the same WiFi/router can reach it. To use a different port: `node server.js 8080`.

## 3. Host: find your own local IP address

Windows: open a terminal and run

```
ipconfig
```

Look for the **IPv4 Address** under your active adapter (Wi-Fi or Ethernet) — something like `192.168.1.42`.

## 4. Everyone else: open the quiz

On the **same Wi-Fi/router** as the host, open a browser and go to:

```
http://<host-IPv4-address>:8000/ft_quiz.html
```

Example: `http://192.168.1.42:8000/ft_quiz.html`

## 5. Host: review results

Open `http://<host-IPv4-address>:8000/results.html` (or `http://127.0.0.1:8000/results.html` on the host's own machine) any time during or after the session. It lists every submission (name, score, %, timestamp) — click a row to expand every question with the student's actual answer, including their typed code.

**Privacy note:** this page has no login. Anyone on the same LAN who knows (or guesses) the URL can open it and see every student's name, score, and answers. That's an acceptable tradeoff for a quick in-class tool, but don't use it for anything more sensitive, and don't expose this server beyond the classroom LAN.

Results live in `data/results.json` on the host's PC (created automatically on the first submission). That folder is gitignored — it's never meant to be committed or published; copy it off the host's machine yourself if you want to keep a record after the session.

## 6. Do a dry run before the real session

Before relying on this live in front of a group, test it with a second device on the actual network you'll use. Some Wi-Fi networks (common on school/office/guest networks) enable **AP/client isolation**, which lets devices reach the internet but blocks them from reaching each other — even though they're on the same network. The only way to know if this affects your network is to test it beforehand.

**If the dry run fails:** turn on a personal mobile hotspot on your phone, have everyone (including you) join that network instead, and repeat steps 2–4 using the hotspot's IP.

## Troubleshooting

- **A firewall prompt appears when you start the server** — this is expected on first run. Allow the connection, or other devices won't be able to reach it.
- **No firewall prompt, but it still doesn't connect** — check for third-party antivirus/security software (not just the built-in OS firewall). These can silently block inbound connections without ever showing a prompt.
- **A device on a different network (e.g. mobile data, a different Wi-Fi) can't load the page** — that's expected. This quiz is LAN-only by design, not hosted on the public internet.
- **A student's results screen says "Could not save your result to the server"** — their score is still shown and accurate, but it wasn't recorded. This happens if `server.js` crashed or was never started (e.g. someone used `python -m http.server` instead, which can serve the page but can't save results). Restart `node server.js` and have them use Retake.
- **`node: command not found`** — Node.js isn't installed on the host machine. Install it from [nodejs.org](https://nodejs.org) and try again.
