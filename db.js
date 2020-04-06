const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database('./olympic_history.db');
const hp = require('./helper');
let count = 0;

const clear = function () {
    const tables = ['results', 'athletes', 'teams', 'sports', 'events', 'games'];
    let promises = [];

    for (let table of tables) {
        promises.push(new Promise((resolve, reject) => {
            database.run(`DELETE FROM ${table}`, err => {
                if (err) {
                    console.log(err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        }));
    }

    return Promise.all(promises);
};

const put = function (params) {
    let [id, name, sex, age, height, weight, team, noc, game, year, season, city, sport, event, medal] = hp.parse(params);
    let gameId, sportId, eventId, teamId, athletesId;

    count++;
    if (count === 1000) {
        process.stdout.write("*");
        count = 0;
    }

    if (id !== 'ID' && id !== undefined) {
        if (year === '1906' && season === 'Summer') {
            return;
        }
        return createGame({ year, season, city })
        .then(tId => {
            gameId = tId;

            //Sports
            return findOrCreate('sports', { name: sport }, { name: sport });
        })
        .then(tId => {
            sportId = tId;

            // Events
            return findOrCreate('events', { name: event }, {
                name: event
            })
        })
        .then(tId => {
            eventId = tId;

            // Teams
            let name = hp.removeSuffix(team);

            return findOrCreate('teams', { noc_name: noc }, {
                name: name, noc_name: noc
            })
        })
        .then(tId => {
            teamId = tId;

            // Athletes
            let yearOfBirth = (age &&  age) ? year - age : null;
            let params = hp.hashToText({ height, weight });
            let full_name = hp.removeTagged(name);

            return findOrCreate('athletes', { id: id }, {
                id: id, full_name: full_name, year_of_birth: yearOfBirth, sex: sex, params: params, team_id: teamId
            });
        })
        .then(tId => {
            athletesId = tId;

            // Results
            let medalValue = { 'NA': 0, 'Gold': 1, 'Silver': 2, 'Bronze': 3 }[medal];

            return insert ('results', {
                athlete_id: athletesId, game_id: gameId, sport_id: sportId, event_id: eventId, medal: medalValue
            });
        })
        .catch(err => {
            console.log(err.message);
        });
    }
};

function createGame (params) {
    let bufSeason = { Summer: 0, Winter: 1 }[params['season']];

    return find('games', { year: params['year'], season: bufSeason }, ['id', 'year', 'season', 'city']).then(rows => {
        if (rows !== undefined) {
            let cities = rows['city'].split(', ');

            if (!cities.includes(params['city'])) {
                cities.push(params['city']);
                return update('games', rows['id'], { city: cities.join(', ') });
            } else {
                return rows['id'];
            }
        } else {
            return insert('games', { year: params['year'], season: bufSeason, city: params['city'] })
        }
    });
}

function findOrCreate (table, findParams, insertParams) {
    return find(table, findParams).then(rows => {
        return (rows && rows['id']) || insert(table, insertParams);
    });
}

function find (table, params, select = ['id']) {
    return new Promise((resolve, reject) => {
        const where = Object.keys(params).map(key => `${key} = "${params[key]}"`).join(' AND ');
        const sql = `SELECT ${select.join(', ')} FROM ${table} WHERE ${where};`;

        database.get(sql, (err, rows) => {
            if (err) {
                console.log('find:', table);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function insert (table, params) {
    return new Promise((resolve, reject) => {
        const strColumns = Object.keys(params).join(', ');
        const strValues = Object.values(params).map(el => `"${el}"`).join(', ');
        const sql = `INSERT INTO ${table}(${strColumns}) VALUES(${strValues});`;

        database.run(sql, function(err) {
            if (err) {
                console.log('insert:', table, strValues);
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function update (table, id, params) {
    return new Promise((resolve, reject) => {
        const set = Object.keys(params).map(key => `${key} = "${params[key]}"`).join(', ');
        const sql = `UPDATE ${table} SET ${set} WHERE id = ${id};`;

        database.run(sql, function(err) {
            if (err) {
                console.log('update:', table, id, params);
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

module.exports = {
  clear,
  put,
};
