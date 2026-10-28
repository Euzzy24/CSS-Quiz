#!/usr/bin/env node
// Structural validation for the QUESTIONS array embedded in ft_quiz.html.
//
// Two question shapes:
//  - mcq (default, no `type` field): 4 non-empty options, a correctIndex in
//    range 0-3, no duplicate option text.
//  - code (`type: "code"`): at least one RegExp in `patterns`, a non-empty
//    `modelAnswer`, and -- critically -- the modelAnswer itself (after the
//    same whitespace normalization the app applies to typed answers) must
//    match at least one pattern. That catches an author writing a pattern
//    the sample answer wouldn't actually pass.
//
// Does NOT check answer-key correctness (whether correctIndex/patterns are
// actually the correct CSS answer) -- that requires a human review pass,
// see the plan doc.
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

function normalizeCode(s) {
  return String(s == null ? "" : s).trim().replace(/\s+/g, " ");
}

const EXPECTED_COUNT = 38;
const EXPECTED_CODE_COUNT = 3;
const problems = [];

if (QUESTIONS.length !== EXPECTED_COUNT) {
  problems.push(`Expected ${EXPECTED_COUNT} questions, found ${QUESTIONS.length}.`);
}

const codeCount = QUESTIONS.filter((q) => q.type === "code").length;
if (codeCount !== EXPECTED_CODE_COUNT) {
  problems.push(`Expected ${EXPECTED_CODE_COUNT} code-input questions, found ${codeCount}.`);
}

QUESTIONS.forEach((q, i) => {
  const n = i + 1;
  if (!q.question || q.question.trim().length === 0) {
    problems.push(`Q${n}: empty question text.`);
  }

  if (q.type === "code") {
    if (!Array.isArray(q.patterns) || q.patterns.length === 0) {
      problems.push(`Q${n}: code question has no patterns to match against.`);
    } else if (q.patterns.some((p) => !(p instanceof RegExp))) {
      problems.push(`Q${n}: code question's patterns must all be RegExp literals.`);
    }
    if (!q.modelAnswer || String(q.modelAnswer).trim().length === 0) {
      problems.push(`Q${n}: code question has no modelAnswer.`);
    } else if (Array.isArray(q.patterns) && q.patterns.length > 0) {
      const normalized = normalizeCode(q.modelAnswer);
      const modelPasses = q.patterns.some((p) => p instanceof RegExp && p.test(normalized));
      if (!modelPasses) {
        problems.push(`Q${n}: modelAnswer "${q.modelAnswer}" does not match any of its own patterns -- fix the pattern or the model answer.`);
      }
    }
    return;
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
