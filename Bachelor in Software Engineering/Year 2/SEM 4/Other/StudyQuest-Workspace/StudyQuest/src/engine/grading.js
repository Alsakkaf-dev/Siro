// Pure answer-checking for all question types.

function normalizeText(s, mode) {
  let t = String(s ?? '').trim();
  if (mode === 'trim-lower' || !mode) t = t.toLowerCase().replace(/\s+/g, ' ');
  if (mode === 'mac') t = t.toLowerCase().replace(/[^0-9a-f]/g, '');
  if (mode === 'cidr') t = t.replace(/\s+/g, '');
  return t;
}

/** Returns { correct: boolean }. `given` shape depends on question type. */
export function checkAnswer(q, given) {
  switch (q.type) {
    case 'mcq':
      return { correct: given === q.answer };
    case 'multi': {
      const a = [...(given ?? [])].sort((x, y) => x - y);
      const b = [...q.answer].sort((x, y) => x - y);
      return { correct: a.length === b.length && a.every((v, i) => v === b[i]) };
    }
    case 'numeric': {
      const val = parseFloat(String(given).replace(/,/g, ''));
      if (Number.isNaN(val)) return { correct: false };
      const tol = q.tolerance ?? 0;
      return { correct: Math.abs(val - q.answer) <= tol };
    }
    case 'text': {
      const norm = normalizeText(given, q.normalize);
      return { correct: (q.accept ?? []).some((acc) => normalizeText(acc, q.normalize) === norm) };
    }
    case 'order': {
      const a = given ?? [];
      const b = q.answer;
      return { correct: a.length === b.length && a.every((v, i) => v === b[i]) };
    }
    default:
      return { correct: false };
  }
}

/** Draw `n` questions deterministically-ish (shuffled) from a bank. */
export function drawQuestions(bank, n, shuffle = true) {
  const qs = [...bank.questions];
  if (shuffle) {
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
  }
  return n ? qs.slice(0, n) : qs;
}

export function scoreGate(questions, answers) {
  let earned = 0;
  let total = 0;
  const perQuestion = questions.map((q, i) => {
    const marks = q.marks ?? 1;
    total += marks;
    const { correct } = checkAnswer(q, answers[i]);
    if (correct) earned += marks;
    return { correct, marks };
  });
  return { earned, total, pct: total === 0 ? 0 : earned / total, perQuestion };
}

export function starsFor(pct, starsRule = { 1: 0.7, 2: 0.8, 3: 0.9 }) {
  if (pct >= starsRule[3]) return 3;
  if (pct >= starsRule[2]) return 2;
  if (pct >= starsRule[1]) return 1;
  return 0;
}
