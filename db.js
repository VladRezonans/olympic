const sqlite3 = require('sqlite3').verbose();

const database = new sqlite3.Database('./olympic_history.db');
const hp = require('./helper');

const tables = ['results', 'athletes', 'teams', 'sports', 'events', 'games'];
const findBuffers = {
  games: {}, teams: {}, events: {}, sports: {}, athletes: {},
};
const saveBuffers = { athletes: [], results: [] };
let count = 0;

const clear = () => {
  const promises = tables.map((table) => new Promise((resolve, reject) => {
    database.run(`DELETE FROM ${table}`, (err) => {
      if (err) {
        process.stdout.write(`\nclear db: ${err}`);
        reject(err);
      } else {
        resolve();
      }
    });
  }));

  return Promise.all(promises);
};

function insert(table, bufKey, params) {
  return new Promise((resolve, reject) => {
    const columns = Object.keys(params).join(', ');
    const values = Object.values(params).map((el) => `"${el}"`).join(', ');
    const sql = `INSERT INTO ${table}(${columns}) VALUES(${values});`;

    database.run(sql, function (err) {
      if (err) {
        process.stdout.write(`\ninsert: ${table}`);
        reject(err);
      } else {
        findBuffers[table][bufKey] = { id: this.lastID, ...params };
        resolve(this.lastID);
      }
    });
  });
}

function update(table, id, bufKey, params) {
  return new Promise((resolve, reject) => {
    const set = Object.keys(params).map((key) => `${key} = "${params[key]}"`).join(', ');
    const sql = `UPDATE ${table} SET ${set} WHERE id = ${id};`;

    database.run(sql, function (err) {
      if (err) {
        process.stdout.write(`\nupdate: ${table} ${id} ${params}`);
        reject(err);
      } else {
        findBuffers[table][bufKey] = { id: this.lastID, ...params };
        resolve(this.lastID);
      }
    });
  });
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
  return new Promise((resolve, reject) => {
    const columns = Object.keys(params[0]).join(', ');
    const values = params.map((param) => `(${Object.values(param).map((el) => `"${el}"`).join(', ')})`).join(', ');
    const sql = `INSERT INTO ${table}(${columns}) VALUES${values};`;

    database.run(sql, function (err) {
      if (err) {
        process.stdout.write(`\ninsert multiple rows: ${err}`);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
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

      const yearOfBirth = (age && age) ? year - age : null;
      const params = hp.hashToText({ height, weight });

      // Athletes
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
      const medalValue = {
        NA: 0, Gold: 1, Silver: 2, Bronze: 3,
      }[medal];

      saveBuffers.results.push({
        athlete_id: id, game_id: gameId, sport_id: sportId, event_id: eventId, medal: medalValue,
      });

      // Save buffers
      if (count === 1000) {
        process.stdout.write('*');
        count = 0;
        await save();
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
