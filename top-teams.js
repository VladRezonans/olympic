const chart = require('./chart');
const db = require('./db_chart');

const medals = ['n/a', 'gold', 'silver', 'bronze'];
const seasons = ['summer', 'winter'];
let years;

const compare = (a, b) => {
  if (a[1] > b[1]) return -1;
  return 1;
};

const getOverAverage = (params) => {
  const results = [];
  const avg = params.reduce((a, b) => a + b[1], 0) / params.length;
  params.forEach((param) => { if (param[1] > avg) results.push(param); });
  return results;
};

const getParams = async (params) => {
  let year; let season; let medal;

  params.forEach((p) => {
    if (p && seasons.includes(p.toLowerCase())) season = p.toLowerCase();
  });
  params.forEach((p) => {
    if (p && medals.includes(p.toLowerCase())) medal = p.toLowerCase();
  });
  years = await db.getYears(season);
  params.forEach((p) => {
    if (p && Object.keys(years).includes(p.toLowerCase())) year = p.toLowerCase();
  });

  return [year, medal];
};

const show = async (argv) => {
  const results = [];
  const [year, medal] = await getParams([argv[3], argv[4], argv[5]]);
  const teams = await db.getTeams();
  const gameIds = year && years[year];
  const medalVal = medal && [medals.indexOf(medal)];

  await Promise.all(Object.keys(teams).map(async (name) => {
    const count = await db.getCountMedals(teams[name], gameIds, medalVal);
    results.push([name, count[0]]);
  }));

  chart.build('NOC Amount', getOverAverage(results).sort(compare));
};

module.exports = {
  show,
};
