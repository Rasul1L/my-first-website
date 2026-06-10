const gamesTableSchema = {
  table: "games",
  columns: {
    id: "string",
    played_at: "date",
    role: ["Don", "Mafia", "Citizen", "Sheriff"],
    result: ["Win", "Loss"],
    points: "number",
    first_blood: "boolean",
    tournament: "string",
    notes: "string"
  }
};

const baselineProfile = {
  games: 112,
  wins: 58,
  points: 36.96,
  cupsMedals: 1,
  roles: {
    Don: { games: 2, wins: 1 },
    Mafia: { games: 19, wins: 14 },
    Citizen: { games: 79, wins: 39 },
    Sheriff: { games: 12, wins: 4 }
  }
};

const storageKey = "rasultech_mafia_games";

function getStoredGames() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveStoredGames(games) {
  localStorage.setItem(storageKey, JSON.stringify(games));
}

function formatPercent(wins, games) {
  if (!games) {
    return "0%";
  }

  const value = (wins / games) * 100;
  return `${Number(value.toFixed(1))}%`;
}

function calculateProfile(games) {
  const profile = JSON.parse(JSON.stringify(baselineProfile));

  games.forEach((game) => {
    const roleStats = profile.roles[game.role];

    if (!roleStats) {
      return;
    }

    profile.games += 1;
    profile.points += Number(game.points) || 0;
    roleStats.games += 1;

    if (game.result === "Win") {
      profile.wins += 1;
      roleStats.wins += 1;
    }
  });

  return profile;
}

function setText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = value;
  }
}

function renderProfile() {
  const games = getStoredGames();
  const profile = calculateProfile(games);
  const ppg = profile.games ? profile.points / profile.games : 0;

  setText('[data-stat="overallWinRate"]', formatPercent(profile.wins, profile.games));
  setText('[data-stat="ppg"]', ppg.toFixed(2));
  setText('[data-stat="cupsMedals"]', profile.cupsMedals);

  Object.entries(profile.roles).forEach(([role, stats]) => {
    setText(`[data-role-games="${role}"]`, stats.games);
    setText(`[data-role-wins="${role}"]`, stats.wins);
    setText(`[data-role-winrate="${role}"]`, formatPercent(stats.wins, stats.games));
  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  window.rasulTechMafiaDatabase = {
    schema: gamesTableSchema,
    get games() {
      return getStoredGames();
    }
  };
});
