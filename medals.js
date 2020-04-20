const chart = require('./chart');
const db = require('./db_chart');

const medals = ['n/a', 'gold', 'silver', 'bronze'];
const seasons = ['summer', 'winter'];
let teams = {};

const compare = (a, b) => {
  if (a[0] > b[0]) return 1;
  return -1;
};

const getParams = async (params) => {
  let noc; let season; let medal;

  teams = await db.getTeams();
  params.forEach((p) => {
    if (p && Object.keys(teams).includes(p.toUpperCase())) noc = p.toUpperCase();
  });
  params.forEach((p) => {
    if (p && seasons.includes(p.toLowerCase())) season = p.toLowerCase();
  });
  params.forEach((p) => {
    if (p && medals.includes(p.toLowerCase())) medal = p.toLowerCase();
  });

  return [noc, season, medal];
};

const show = async (argv) => {
  const result = [];
  const [noc, season, medal] = await getParams([argv[3], argv[4], argv[5]]);

  if (noc === undefined) {
    process.stdout.write('exit: NOC is undefined\n');
    process.exit(1);
  }

  const teamId = teams[noc];
  const years = await db.getYears(season);
  const medalVal = medal && [medals.indexOf(medal)];

  await Promise.all(Object.keys(years).map(async (year) => {
    const count = await db.getCountMedals(teamId, years[year], medalVal);
    result.push([year, count[0]]);
  }));

  chart.build('Year Amount', result.sort(compare));
};

module.exports = {
  show,
};
