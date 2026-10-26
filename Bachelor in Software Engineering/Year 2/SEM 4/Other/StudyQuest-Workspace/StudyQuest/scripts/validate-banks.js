// Lint all question banks + country.json references.
// Usage: node scripts/validate-banks.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');
let errors = 0;
let banksChecked = 0;
let questionsChecked = 0;

function err(msg) {
  errors++;
  console.error(`  ✗ ${msg}`);
}

function validateQuestion(q, where) {
  questionsChecked++;
  const w = `${where} [${q.id ?? '??'}]`;
  if (!q.id) err(`${w}: missing id`);
  if (!q.prompt) err(`${w}: missing prompt`);
  if (!q.explain) err(`${w}: missing explain`);
  if (!q.source) err(`${w}: missing source`);
  switch (q.type) {
    case 'mcq':
      if (!Array.isArray(q.options) || q.options.length < 2) err(`${w}: mcq needs >=2 options`);
      else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length)
        err(`${w}: mcq answer index out of range`);
      break;
    case 'multi':
      if (!Array.isArray(q.options) || q.options.length < 2) err(`${w}: multi needs >=2 options`);
      else if (!Array.isArray(q.answer) || q.answer.length === 0) err(`${w}: multi answer must be a non-empty array`);
      else if (q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length))
        err(`${w}: multi answer index out of range`);
      break;
    case 'numeric':
      if (typeof q.answer !== 'number') err(`${w}: numeric answer must be a number`);
      if (typeof q.tolerance !== 'number') err(`${w}: numeric tolerance missing`);
      break;
    case 'text':
      if (!Array.isArray(q.accept) || q.accept.length === 0) err(`${w}: text needs accept[]`);
      break;
    case 'order':
      if (!Array.isArray(q.items) || q.items.length < 2) err(`${w}: order needs items[]`);
      else if (
        !Array.isArray(q.answer) ||
        q.answer.length !== q.items.length ||
        [...q.answer].sort((a, b) => a - b).some((v, i) => v !== i)
      )
        err(`${w}: order answer must be a permutation of 0..${q.items.length - 1}`);
      break;
    default:
      err(`${w}: unknown type "${q.type}"`);
  }
}

function validateBank(file) {
  banksChecked++;
  const rel = path.relative(CONTENT, file);
  let bank;
  try {
    bank = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return err(`${rel}: invalid JSON — ${e.message}`);
  }
  if (!bank.bankId) err(`${rel}: missing bankId`);
  if (!Array.isArray(bank.questions) || bank.questions.length === 0)
    return err(`${rel}: no questions`);
  const ids = new Set();
  for (const q of bank.questions) {
    if (q.id && ids.has(q.id)) err(`${rel}: duplicate question id ${q.id}`);
    ids.add(q.id);
    validateQuestion(q, rel);
  }
}

// 1. Validate every bank file
const subjectsDir = path.join(CONTENT, 'subjects');
for (const subj of fs.existsSync(subjectsDir) ? fs.readdirSync(subjectsDir) : []) {
  const banksDir = path.join(subjectsDir, subj, 'banks');
  if (!fs.existsSync(banksDir)) continue;
  for (const f of fs.readdirSync(banksDir)) {
    if (f.endsWith('.json')) validateBank(path.join(banksDir, f));
  }
}

// 2. Validate country.json references (banks exist, gate draw <= bank size, mission ids unique)
for (const subj of fs.existsSync(subjectsDir) ? fs.readdirSync(subjectsDir) : []) {
  const countryFile = path.join(subjectsDir, subj, 'country.json');
  if (!fs.existsSync(countryFile)) continue;
  let country;
  try {
    country = JSON.parse(fs.readFileSync(countryFile, 'utf8'));
  } catch (e) {
    err(`${subj}/country.json: invalid JSON — ${e.message}`);
    continue;
  }
  const missionIds = new Set();
  const cityIds = new Set(country.cities.map((c) => c.id));
  for (const city of country.cities) {
    if (city.unlock?.type === 'gatePassed' && !cityIds.has(city.unlock.cityId))
      err(`${subj}/${city.id}: unlock references unknown city ${city.unlock.cityId}`);
    for (const m of city.missions) {
      if (missionIds.has(m.id)) err(`${subj}: duplicate mission id ${m.id}`);
      missionIds.add(m.id);
      if (m.type === 'READ') {
        if (!m.target?.path) err(`${subj}/${m.id}: READ missing target.path`);
        if (m.target?.pages && m.target.pages[0] > m.target.pages[1])
          err(`${subj}/${m.id}: pages range inverted`);
      }
      if ((m.type === 'PRACTICE' || m.type === 'GATE') && m.bank) {
        const bankFile = path.join(CONTENT, m.bank);
        if (!fs.existsSync(bankFile)) {
          err(`${subj}/${m.id}: bank file not found: ${m.bank}`);
        } else if (m.type === 'GATE' && m.goal?.draw) {
          const bank = JSON.parse(fs.readFileSync(bankFile, 'utf8'));
          if (bank.questions.length < m.goal.draw)
            err(`${subj}/${m.id}: gate draws ${m.goal.draw} but bank has only ${bank.questions.length}`);
        }
      }
    }
  }
}

console.log(`\nChecked ${banksChecked} banks, ${questionsChecked} questions.`);
if (errors) {
  console.error(`${errors} error(s) found.`);
  process.exit(1);
} else {
  console.log('All banks valid ✓');
}
