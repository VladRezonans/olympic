const db = require('./db');

const seasons = { summer: 0, winter: 1 };

const getTeams = async () => {
  const teams = {};
  const results = await db.dbAll('SELECT id, noc_name FROM teams');
  results.forEach((result) => { teams[result.noc_name] = result.id; });
  return teams;
};

const getYears = async (season) => {
  const years = {};
  const where = (season !== undefined) ? `WHERE season = ${seasons[season]}` : '';
  const results = await db.dbAll(`SELECT year, id FROM games ${where} ORDER BY year ASC`);
  results.forEach((result) => {
    (years[result.year] = years[result.year] || []).push(result.id);
  });
  return years;
};

const getCountMedals = async (teamId, games, medals = [1, 2, 3]) => {
  const jA = 'INNER JOIN athletes ON athletes.team_id = teams.id';
  const jR = 'INNER JOIN results ON results.athlete_id = athletes.id';
  const wT = `teams.id = ${teamId}`;
  const wM = `AND results.medal IN (${medals.join(', ')})`;
  const wG = (games !== undefined) ? `AND results.game_id IN (${games.join(', ')})` : '';
  const results = await db.dbAll(`SELECT COUNT(*) FROM teams ${jA} ${jR} WHERE ${wT} ${wM} ${wG};`);
  return results.map((result) => result['COUNT(*)']);
};

module.exports = {
  getTeams,
  getYears,
  getCountMedals,
};
