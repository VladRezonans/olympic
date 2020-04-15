const sqlite3 = require('sqlite3').verbose();

const database = new sqlite3.Database('./olympic_history.db');
const hp = require('./helper');

const tables = ['results', 'athletes', 'teams', 'sports', 'events', 'games'];
const findBuffers = {
  games: {}, teams: {}, events: {}, sports: {}, athletes: {},
};
const saveBuffers = { athletes: [], results: [] };
const medals = {
  NA: 0, Gold: 1, Silver: 2, Bronze: 3,
};
let count = 0;

const dbRun = (sql) => new Promise((resolve, reject) => {
  database.run(sql, function (err) {
    if (err) {
      process.stdout.write(err);
      reject(err);
    } else {
      resolve(this.lastID);
    }
    return this.lastID;
  });
});

const clear = () => Promise.all(tables.map((table) => dbRun(`DELETE FROM ${table}`)));

async function insert(table, bufKey, params) {
  const columns = Object.keys(params).join(', ');
  const values = Object.values(params).map((el) => `"${el}"`).join(', ');
  const sql = `INSERT INTO ${table}(${columns}) VALUES(${values});`;
  const id = await dbRun(sql);
  findBuffers[table][bufKey] = { id, ...params };
  return id;
}

async function update(table, tableId, bufKey, params) {
  const set = Object.keys(params).map((key) => `${key} = "${params[key]}"`).join(', ');
  const sql = `UPDATE ${table} SET ${set} WHERE id = ${tableId};`;
  const id = await dbRun(sql);
  findBuffers[table][bufKey] = { id, ...params };
  return id;
}

function findOrCreate(table, searchKey, insertParams) {
  const find = findBuffers[table][searchKey];
  if (find) return find.id;
  return insert(table, searchKey, insertParams);
}

function createGame(game, params) {
  const bufSeason = { Summer: 0, Winter: 1 }[params.season];
  const find = findBuffers.games[game];

  if (find) {
    const cities = find.city.split(', ');

    if (!cities.includes(params.city)) {
      cities.push(params.city);
      return update('games', find.id, game, { city: cities.join(', ') });
    }
    return find.id;
  }
  return insert('games', game, { year: params.year, season: bufSeason, city: params.city });
}

function insertMultipleRows(table, params) {
  const columns = Object.keys(params[0]).join(', ');
  const values = params.map((param) => `(${Object.values(param).map((el) => `"${el}"`).join(', ')})`).join(', ');
  const sql = `INSERT INTO ${table}(${columns}) VALUES${values};`;
  return dbRun(sql);
}

const save = () => {
  const promises = ['athletes', 'results'].map((table) => insertMultipleRows(table, saveBuffers[table]));
  return Promise.all(promises);
};

const put = async (params) => {
  const [id, name, sex, age, height, weight, team, noc, game, year, season, city,
    sport, event, medal] = hp.parse(params);

  if (id !== 'ID' && id !== undefined) {
    if (year === '1906' && season === 'Summer') return;
    count += 1;

    try {
      const gameId = await createGame(game, { year, season, city });
      const sportId = await findOrCreate('sports', sport, { name: sport });
      const eventId = await findOrCreate('events', event, { name: event });
      const teamId = await findOrCreate('teams', noc, {
        name: hp.removeSuffix(team), noc_name: noc,
      });

      // Athletes
      const yearOfBirth = (age && age) ? year - age : null;
      const params = hp.hashToText({ height, weight });
      if (findBuffers.athletes[id] === undefined) {
        findBuffers.athletes[id] = id;
        saveBuffers.athletes.push({
          id,
          full_name: hp.removeTagged(name),
          year_of_birth: yearOfBirth,
          sex,
          params,
          team_id: teamId,
        });
      }

      // Results
      saveBuffers.results.push({
        athlete_id: id, game_id: gameId, sport_id: sportId, event_id: eventId, medal: medals[medal],
      });

      // Save buffers
      if (count === 1000) {
        await save();
        process.stdout.write('*');
        count = 0;
        saveBuffers.athletes = [];
        saveBuffers.results = [];
      }
    } catch (err) {
      process.stdout.write(`\nexit: ${err.message}`);
      process.exit(1);
    }
  }
};

module.exports = {
  clear,
  put,
  save,
};
