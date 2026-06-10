const puzzles = [
  {
    category: "Find the Don",
    difficulty: "Advanced",
    phase: "Day 2",
    title: "Fast Vote Trap",
    situation: "Player 4 was eliminated on Day 1 and revealed as Citizen. At night, Player 8 was killed. Player 2 claims Sheriff and says Player 6 is black. Player 6 denies it. Player 9 protects Player 6 without clear logic. Player 3 avoids choosing a side. Player 10 pushes the table to vote Player 2 quickly.",
    question: "Who is most likely to be the Don?",
    choices: ["Player 2", "Player 3", "Player 9", "Player 10"],
    answer: "Player 10",
    explanation: "Player 10 is trying to rush the table into eliminating the claimed Sheriff before discussion develops. That control behavior fits the Don profile better than simple defense.",
    betterDecision: "Slow the table down, compare Player 2 and Player 6 speeches, and force Player 10 to explain the rush.",
    checks: ["Player 2 claims Sheriff: Player 6 is black"],
    votes: ["Day 1: Player 4 eliminated as Citizen", "Night 1: Player 8 killed", "Day 2: Player 10 pushes fast vote on Player 2"],
    clues: ["Rushing a Sheriff claim often protects black team tempo", "Player 9 is suspicious, but Player 10 controls the table", "Player 3 is passive, not leading"],
    players: [
      ["1", "Alive", "Quiet observer"], ["2", "Alive", "Claims Sheriff"], ["3", "Alive", "Avoids side"], ["4", "Dead", "Citizen"],
      ["5", "Alive", "Asks for logic"], ["6", "Alive", "Checked black"], ["7", "Alive", "Neutral"], ["8", "Dead", "Night kill"],
      ["9", "Alive", "Protects 6"], ["10", "Alive", "Rushing vote"]
    ],
    checked: ["2", "6"]
  },
  {
    category: "Find the Mafia",
    difficulty: "Intermediate",
    phase: "Day 1",
    title: "Soft Agreement",
    situation: "Player 1 gives a strong red speech. Player 5 agrees with every popular opinion but never creates a position. Player 7 attacks Player 1 with weak logic, then backs away when challenged. Player 10 asks sharp questions and keeps pressure on contradictions.",
    question: "Who is the most likely Mafia?",
    choices: ["Player 1", "Player 5", "Player 7", "Player 10"],
    answer: "Player 5",
    explanation: "Player 5 is blending into the table by agreeing with safe opinions while avoiding responsibility. That is often stronger mafia behavior than visible conflict.",
    betterDecision: "Pressure Player 5 to name two black candidates and explain a voting plan.",
    checks: ["No Sheriff checks yet"],
    votes: ["Early Day 1: Player 5 follows majority reads", "Mid Day 1: Player 7 backs away from attack"],
    clues: ["No original reads", "Avoids responsibility", "Uses consensus as cover"],
    players: [
      ["1", "Alive", "Strong red speech"], ["2", "Alive", "Neutral"], ["3", "Alive", "Questioning"], ["4", "Alive", "Silent"],
      ["5", "Alive", "Soft agrees"], ["6", "Alive", "Short speech"], ["7", "Alive", "Weak attack"], ["8", "Alive", "Calm"],
      ["9", "Alive", "Low info"], ["10", "Alive", "Sharp questions"]
    ],
    checked: []
  },
  {
    category: "Sheriff Decision",
    difficulty: "Advanced",
    phase: "Night 2",
    title: "Check the Controller",
    situation: "Player 3 is confirmed red from your first check. Player 6 and Player 9 are arguing loudly. Player 10 has not been attacked and quietly redirects every discussion away from Player 5. The table is split between 6 and 9.",
    question: "As Sheriff, whom should you check?",
    choices: ["Player 6", "Player 9", "Player 10", "Player 3"],
    answer: "Player 10",
    explanation: "The loud conflict may be a distraction. Player 10 is controlling direction without taking heat, which is high-value information for Sheriff.",
    betterDecision: "Check the hidden controller, not only the loudest conflict.",
    checks: ["Night 1: Player 3 is red"],
    votes: ["Day 2: Table splits between Player 6 and Player 9", "Player 10 redirects pressure away from Player 5 twice"],
    clues: ["Low-risk control", "Avoids direct conflict", "Protects a possible partner indirectly"],
    players: [
      ["1", "Alive", "Unsure"], ["2", "Alive", "You"], ["3", "Alive", "Checked red"], ["4", "Dead", "Citizen"],
      ["5", "Alive", "Protected"], ["6", "Alive", "Loud conflict"], ["7", "Alive", "Low info"], ["8", "Dead", "Night kill"],
      ["9", "Alive", "Loud conflict"], ["10", "Alive", "Redirects table"]
    ],
    checked: ["3"]
  },
  {
    category: "Final Vote",
    difficulty: "Expert",
    phase: "Endgame",
    title: "Four Player Lock",
    situation: "Alive: Players 1, 3, 6, 10. Player 3 is confirmed red. Player 6 voted both eliminated Citizens. Player 10 voted one Mafia on Day 2 but only after the vote was already decided. Player 1 led the vote that eliminated a Mafia.",
    question: "Who should the red team vote?",
    choices: ["Player 1", "Player 3", "Player 6", "Player 10"],
    answer: "Player 6",
    explanation: "Player 6 has the worst vote record and no red-confirming action. Player 10's bus vote is suspicious, but Player 6 damaged red team twice.",
    betterDecision: "Trust confirmed red Player 3 and eliminate the player with the most harmful voting history.",
    checks: ["Player 3 is confirmed red"],
    votes: ["Day 1: Player 6 votes Citizen", "Day 2: Player 10 late-votes Mafia", "Day 3: Player 1 leads Mafia elimination"],
    clues: ["Confirmed red exists", "Player 6 has repeated anti-red outcomes", "Late bus vote has less value"],
    players: [
      ["1", "Alive", "Led Mafia vote"], ["2", "Dead", "Citizen"], ["3", "Alive", "Confirmed red"], ["4", "Dead", "Citizen"],
      ["5", "Dead", "Mafia"], ["6", "Alive", "Bad vote record"], ["7", "Dead", "Citizen"], ["8", "Dead", "Sheriff"],
      ["9", "Dead", "Don"], ["10", "Alive", "Late bus vote"]
    ],
    checked: ["3"]
  },
  {
    category: "Table Mistake",
    difficulty: "Intermediate",
    phase: "Day 2",
    title: "Ignored Counterpush",
    situation: "Player 7 claimed Sheriff late and named Player 2 red. Player 2 immediately gave a clear timeline and asked Player 7 for night logic. Player 9 interrupted and moved the table to vote Player 2 without letting Player 7 answer.",
    question: "Where did the red team make the critical mistake?",
    choices: ["Trusting Player 2 too much", "Not forcing Player 7 to explain the check", "Letting Player 9 control the vote", "Ignoring Player 1"],
    answer: "Letting Player 9 control the vote",
    explanation: "The table allowed a third player to control tempo before the Sheriff claim could be tested. That removed information and protected possible black coordination.",
    betterDecision: "Pause the vote and force both Player 7 and Player 9 to explain their logic.",
    checks: ["Player 7 claims Sheriff: Player 2 is red"],
    votes: ["Player 9 interrupts", "Table votes Player 2 before Player 7 explains"],
    clues: ["Tempo control", "Unanswered Sheriff logic", "Vote moved before comparison"],
    players: [
      ["1", "Alive", "Ignored"], ["2", "Alive", "Accused"], ["3", "Alive", "Listening"], ["4", "Dead", "Citizen"],
      ["5", "Alive", "Neutral"], ["6", "Alive", "Unclear"], ["7", "Alive", "Late Sheriff claim"], ["8", "Dead", "Night kill"],
      ["9", "Alive", "Controls vote"], ["10", "Alive", "Quiet"]
    ],
    checked: ["2", "7"]
  },
  {
    category: "Best Argument",
    difficulty: "Beginner",
    phase: "Day 1",
    title: "Win the Table",
    situation: "Player 6 is suspicious because they changed reads three times. Player 8 is pushing emotion. Player 4 asks for a clean argument before nominations close.",
    question: "Which argument is strongest?",
    choices: [
      "Player 6 is black because I feel it.",
      "Player 8 talks too much, vote them.",
      "Player 6 changed reads three times without new information, so their logic is unstable.",
      "Everyone who disagrees with me is black."
    ],
    answer: "Player 6 changed reads three times without new information, so their logic is unstable.",
    explanation: "The best argument is specific, evidence-based, and easy for the table to verify.",
    betterDecision: "Use concrete contradictions instead of emotion or pressure.",
    checks: ["No Sheriff checks yet"],
    votes: ["Nomination phase: Player 4 asks for final logic"],
    clues: ["Specific behavior", "Verifiable contradiction", "Persuasive table logic"],
    players: [
      ["1", "Alive", "Neutral"], ["2", "Alive", "Calm"], ["3", "Alive", "Watching"], ["4", "Alive", "Asks logic"],
      ["5", "Alive", "Silent"], ["6", "Alive", "Changing reads"], ["7", "Alive", "Low info"], ["8", "Alive", "Emotional push"],
      ["9", "Alive", "Observer"], ["10", "Alive", "Balanced"]
    ],
    checked: []
  }
];

const state = {
  current: 0,
  solved: 0,
  correct: 0,
  score: 0,
  streak: 0,
  selectedEvidence: new Set(),
  answered: false,
  category: {}
};

const $ = (selector) => document.querySelector(selector);

function updateDashboard() {
  const accuracy = state.solved ? Math.round((state.correct / state.solved) * 100) : 0;
  const levels = ["Rookie", "Club Player", "Tournament Player", "Pro Player", "Legend"];
  const levelIndex = Math.min(levels.length - 1, Math.floor(state.correct / 2));

  $('[data-dashboard="solved"]').textContent = state.solved;
  $('[data-dashboard="accuracy"]').textContent = `${accuracy}%`;
  $('[data-dashboard="score"]').textContent = state.score;
  $('[data-dashboard="streak"]').textContent = state.streak;
  $('[data-dashboard="level"]').textContent = levels[levelIndex];
}

function renderPlayers(puzzle) {
  const table = $('[data-player-table]');
  table.innerHTML = '<div class="table-center">10 Player<br>Table</div>';

  puzzle.players.forEach(([number, status, note], index) => {
    const card = document.createElement("article");
    const angle = index * 36;
    card.className = `player-card ${status === "Dead" ? "dead" : ""} ${puzzle.checked.includes(number) ? "checked" : ""}`;
    card.style.setProperty("--angle", `${angle}deg`);
    card.innerHTML = `
      <div class="player-number">P${number}</div>
      <span class="player-status">${status}</span>
      <div class="player-note">${note}</div>
    `;
    table.appendChild(card);
  });
}

function renderList(container, items, className) {
  container.innerHTML = items.map((item) => `<div class="${className}">${item}</div>`).join("");
}

function renderPuzzle() {
  const puzzle = puzzles[state.current];
  state.selectedEvidence = new Set();
  state.answered = false;
  $('[data-puzzle-category]').textContent = puzzle.category;
  $('[data-puzzle-title]').textContent = puzzle.title;
  $('[data-puzzle-difficulty]').textContent = puzzle.difficulty;
  $('[data-puzzle-phase]').textContent = puzzle.phase;
  $('[data-puzzle-alive]').textContent = `${puzzle.players.filter((player) => player[1] === "Alive").length} alive`;
  $('[data-puzzle-situation]').textContent = puzzle.situation;
  $('[data-puzzle-question]').textContent = puzzle.question;

  renderPlayers(puzzle);
  renderList($('[data-puzzle-checks]'), puzzle.checks, "check-item");
  renderList($('[data-puzzle-votes]'), puzzle.votes, "timeline-item");
  renderList($('[data-puzzle-clues]'), puzzle.clues, "clue-item");
  renderEvidenceBoard(puzzle);

  const answers = $('[data-answer-list]');
  answers.innerHTML = "";
  puzzle.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "answer-card";
    button.textContent = choice;
    button.disabled = true;
    button.addEventListener("click", () => answerPuzzle(choice));
    answers.appendChild(button);
  });

  $('[data-result-panel]').hidden = true;
  updateAnswerLock();
}

function renderEvidenceBoard(puzzle) {
  const board = $('[data-evidence-board]');
  board.innerHTML = "";
  puzzle.clues.forEach((clue, index) => {
    const button = document.createElement("button");
    button.className = "evidence-chip";
    button.textContent = clue;
    button.addEventListener("click", () => toggleEvidence(index, button));
    board.appendChild(button);
  });
}

function toggleEvidence(index, button) {
  if (state.answered) {
    return;
  }

  if (state.selectedEvidence.has(index)) {
    state.selectedEvidence.delete(index);
    button.classList.remove("selected");
  } else {
    state.selectedEvidence.add(index);
    button.classList.add("selected");
  }

  updateAnswerLock();
}

function updateAnswerLock() {
  const unlocked = state.selectedEvidence.size >= 2;
  const lock = $('[data-answer-lock]');
  lock.textContent = unlocked
    ? "Evidence locked. Choose the best answer."
    : `Select ${2 - state.selectedEvidence.size} more clue${state.selectedEvidence.size === 1 ? "" : "s"} to unlock answers.`;

  document.querySelectorAll(".answer-card").forEach((button) => {
    button.disabled = !unlocked || state.answered;
  });
}

function answerPuzzle(choice) {
  const puzzle = puzzles[state.current];
  if (state.selectedEvidence.size < 2 || state.answered) {
    return;
  }

  state.answered = true;
  const isCorrect = choice === puzzle.answer;
  const categoryStats = state.category[puzzle.category] || { total: 0, correct: 0 };
  state.solved += 1;
  categoryStats.total += 1;

  if (isCorrect) {
    state.correct += 1;
    categoryStats.correct += 1;
    state.streak += 1;
    state.score += 100 + state.selectedEvidence.size * 10 + state.streak * 15;
  } else {
    state.streak = 0;
    state.score += state.selectedEvidence.size * 5;
  }

  state.category[puzzle.category] = categoryStats;

  document.querySelectorAll(".answer-card").forEach((button) => {
    button.disabled = true;
    if (button.textContent === puzzle.answer) button.classList.add("correct");
    if (button.textContent === choice && !isCorrect) button.classList.add("wrong");
  });

  const result = $('[data-result-panel]');
  const selectedClues = [...state.selectedEvidence].map((index) => puzzle.clues[index]);
  result.hidden = false;
  result.innerHTML = `
    <h3 class="result-title ${isCorrect ? "correct-text" : "wrong-text"}">${isCorrect ? "Correct" : "Incorrect"}</h3>
    <p><strong>Evidence selected:</strong> ${selectedClues.join(" | ")}</p>
    <p>${puzzle.explanation}</p>
    <div class="key-clues">${puzzle.clues.map((clue) => `<div class="clue-item">${clue}</div>`).join("")}</div>
    <p><strong>Better decision:</strong> ${puzzle.betterDecision}</p>
    <button class="next-button" data-next-puzzle>Next Puzzle</button>
  `;
  result.querySelector("[data-next-puzzle]").addEventListener("click", nextPuzzle);
  updateDashboard();
}

function nextPuzzle() {
  state.current = (state.current + 1) % puzzles.length;
  renderPuzzle();
}

function initParticles() {
  const container = document.querySelector(".particles");
  for (let i = 0; i < 18; i += 1) {
    const particle = document.createElement("span");
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    container.appendChild(particle);
  }
}

document.querySelector("[data-start-training]").addEventListener("click", () => {
  document.querySelector("#trainer").scrollIntoView({ behavior: "smooth" });
});

initParticles();
renderPuzzle();
updateDashboard();
