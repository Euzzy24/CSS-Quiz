#!/usr/bin/env node
// Minimal LAN server for the CSS quiz: serves the static pages AND a tiny
// JSON-file "database" of student results, using only Node's built-in
// modules -- no npm install required, matching the project's zero-dependency
// approach. Binds to all network interfaces so other devices on the same
// WiFi/router can reach it (see README.md for the full hosting walkthrough).
//
// Run: node server.js [port]   (default port: 8000)
//
// Routes:
//   GET  /                 -> ft_quiz.html
//   GET  /<static file>     -> serves that file from this directory
//   POST /api/results       -> append one student's result (JSON body)
//   GET  /api/results       -> all stored results, newest first (JSON array)
//
// Results are stored in data/results.json (created automatically on first
// submission). That file is gitignored -- it holds real student names and
// answers and should never be committed to the repo.

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const RESULTS_FILE = path.join(DATA_DIR, "results.json");
const PORT = parseInt(process.argv[2], 10) || parseInt(process.env.PORT, 10) || 8000;
const MAX_BODY_BYTES = 200 * 1024; // 200KB is generous for one quiz submission

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// ---------- tiny JSON-file "database", writes serialized through a queue so
// two near-simultaneous submissions can't clobber each other ----------
let writeQueue = Promise.resolve();

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RESULTS_FILE)) fs.writeFileSync(RESULTS_FILE, "[]\n", "utf8");
}

function readResults() {
  ensureDataFile();
  try {
    var raw = fs.readFileSync(RESULTS_FILE, "utf8");
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Warning: data/results.json was unreadable/corrupt, treating as empty.", err.message);
    return [];
  }
}

function appendResult(record) {
  writeQueue = writeQueue.then(function () {
    var all = readResults();
    all.push(record);
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(all, null, 2) + "\n", "utf8");
    return record;
  });
  return writeQueue;
}

// ---------- validation ----------
function isPlainString(v, maxLen) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= maxLen;
}

function validateSubmission(body) {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  if (!isPlainString(body.name, 80)) return "`name` must be a non-empty string (max 80 chars).";
  if (typeof body.score !== "number" || !Number.isFinite(body.score) || body.score < 0) {
    return "`score` must be a non-negative number.";
  }
  if (typeof body.total !== "number" || !Number.isFinite(body.total) || body.total <= 0) {
    return "`total` must be a positive number.";
  }
  if (body.score > body.total) return "`score` cannot exceed `total`.";
  if (!Array.isArray(body.answers)) return "`answers` must be an array.";
  if (body.answers.length > 200) return "`answers` array is unreasonably large.";
  return null;
}

// ---------- static file serving (path-traversal safe) ----------
function serveStatic(req, res, urlPath) {
  var relPath = urlPath === "/" ? "ft_quiz.html" : decodeURIComponent(urlPath.replace(/^\/+/, ""));
  var fullPath = path.normalize(path.join(ROOT, relPath));

  // Reject anything that resolves outside the project root.
  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }
  // Never serve the results data file or server source as a raw static file.
  if (fullPath === RESULTS_FILE || relPath.indexOf("data" + path.sep) === 0 || relPath === "data") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  fs.readFile(fullPath, function (err, content) {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found: " + relPath);
      return;
    }
    var ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

// ---------- request handling ----------
function readJsonBody(req, callback) {
  var chunks = [];
  var total = 0;
  var tooLarge = false;

  req.on("data", function (chunk) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      tooLarge = true;
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", function () {
    if (tooLarge) return callback(new Error("Request body too large."));
    try {
      var body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
      callback(null, body);
    } catch (err) {
      callback(new Error("Invalid JSON body."));
    }
  });
  req.on("error", function (err) { callback(err); });
}

function sendJson(res, status, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

var server = http.createServer(function (req, res) {
  var urlPath = req.url.split("?")[0];

  if (req.method === "POST" && urlPath === "/api/results") {
    readJsonBody(req, function (err, body) {
      if (err) return sendJson(res, 400, { error: err.message });

      var problem = validateSubmission(body);
      if (problem) return sendJson(res, 400, { error: problem });

      var record = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name: body.name.trim(),
        score: body.score,
        total: body.total,
        submittedAt: new Date().toISOString(),
        answers: body.answers,
      };

      appendResult(record)
        .then(function () { sendJson(res, 201, { ok: true, id: record.id }); })
        .catch(function (writeErr) {
          console.error("Failed to write result:", writeErr);
          sendJson(res, 500, { error: "Could not save result on the server." });
        });
    });
    return;
  }

  if (req.method === "GET" && urlPath === "/api/results") {
    var all = readResults().slice().sort(function (a, b) {
      return (b.submittedAt || "").localeCompare(a.submittedAt || "");
    });
    sendJson(res, 200, all);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res, urlPath);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("Method not allowed");
});

ensureDataFile();
server.listen(PORT, "0.0.0.0", function () {
  console.log("CSS Quiz server running.");
  console.log("  Local:   http://127.0.0.1:" + PORT + "/ft_quiz.html");
  console.log("  Results: http://127.0.0.1:" + PORT + "/results.html");
  console.log("  (Find your LAN IP with `ipconfig` and swap 127.0.0.1 for it so other devices can connect.)");
  console.log("  Results are stored in: " + RESULTS_FILE);
});
