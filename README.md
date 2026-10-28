# CSS Quiz — LAN Hosting

A 35-question CSS quiz in a single self-contained file (`ft_quiz.html`). No install, no build step, no backend — just a static file and a local HTTP server.

Each person takes the quiz on their own device and sees only their own score at the end. Nothing is collected or sent anywhere.

## 1. Host: start a local server

From this folder (the one containing `ft_quiz.html`), run one of these.

**Option A — Python (recommended, usually already installed):**

```
python -m http.server 8000
```

Python's server binds to all network interfaces by default — no extra flags needed. You should see `Serving HTTP on 0.0.0.0 port 8000`.

**Option B — Node (if you don't have Python, but do have Node.js/npm installed):**

```
npx serve -l 8000
```

Note: `npx serve` requires Node.js/npm already installed, and the very first run may need an internet connection to download the `serve` package (later runs can work offline once it's cached).

## 2. Host: find your own local IP address

Windows: open a terminal and run

```
ipconfig
```

Look for the **IPv4 Address** under your active adapter (Wi-Fi or Ethernet) — something like `192.168.1.42`.

## 3. Everyone else: open the quiz

On the **same Wi-Fi/router** as the host, open a browser and go to:

```
http://<host-IPv4-address>:8000/ft_quiz.html
```

Example: `http://192.168.1.42:8000/ft_quiz.html`

## 4. Do a dry run before the real session

Before relying on this live in front of a group, test it with a second device on the actual network you'll use. Some Wi-Fi networks (common on school/office/guest networks) enable **AP/client isolation**, which lets devices reach the internet but blocks them from reaching each other — even though they're on the same network. The only way to know if this affects your network is to test it beforehand.

**If the dry run fails:** turn on a personal mobile hotspot on your phone, have everyone (including you) join that network instead, and repeat steps 1–3 using the hotspot's IP.

## Troubleshooting

- **A firewall prompt appears when you start the server** — this is expected on first run. Allow the connection, or other devices won't be able to reach it.
- **No firewall prompt, but it still doesn't connect** — check for third-party antivirus/security software (not just the built-in OS firewall). These can silently block inbound connections without ever showing a prompt.
- **A device on a different network (e.g. mobile data, a different Wi-Fi) can't load the page** — that's expected. This quiz is LAN-only by design, not hosted on the public internet.
