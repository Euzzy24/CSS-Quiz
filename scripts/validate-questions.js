#!/usr/bin/env node
// Structural validation for the QUESTIONS array embedded in ft_quiz.html.
// Checks: exactly 35 questions, each with 4 non-empty options, a correctIndex
// in range 0-3, no duplicate option text, and a non-empty question string.
// Does NOT check answer-key correctness (whether correctIndex is the actually
// correct CSS answer) -- that requires a human review pass, see the plan doc.
//
// Run: node scripts/validate-questions.js

const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "ft_quiz.html");
const html = fs.readFileSync(htmlPath, "utf8");

const match = html.match(/var QUESTIONS = (\[[\s\S]*?\]);/);
if (!match) {
  console.error("Could not find `var QUESTIONS = [...]` in ft_quiz.html");
  process.exit(1);
}

const QUESTIONS = eval(match[1]);

const EXPECTED_COUNT = 35;
const problems = [];

if (QUESTIONS.length !== EXPECTED_COUNT) {
  problems.push(`Expected ${EXPECTED_COUNT} questions, found ${QUESTIONS.length}.`);
}

QUESTIONS.forEach((q, i) => {
  const n = i + 1;
  if (!q.question || q.question.trim().length === 0) {
    problems.push(`Q${n}: empty question text.`);
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    problems.push(`Q${n}: expected 4 options, found ${q.options ? q.options.length : 0}.`);
  } else {
    const normalized = q.options.map((o) => String(o).trim().toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      problems.push(`Q${n}: duplicate option text.`);
    }
    if (q.options.some((o) => !o || String(o).trim().length === 0)) {
      problems.push(`Q${n}: contains an empty option.`);
    }
  }
  if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) {
    problems.push(`Q${n}: correctIndex out of range (0-3): ${q.correctIndex}.`);
  }
});

if (problems.length > 0) {
  console.error("Question bank validation FAILED:\n");
  problems.forEach((p) => console.error(" - " + p));
  process.exit(1);
}

console.log(`Question bank OK: ${QUESTIONS.length} questions, all structurally valid.`);
