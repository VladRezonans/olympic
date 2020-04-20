const medals = require('./medals');
const tops = require('./top-teams');

const statistic = process.argv[2].toLowerCase();
const start = new Date();

(async () => {
  if (statistic === 'medals') await medals.show(process.argv);
  else if (statistic === 'top-teams') await tops.show(process.argv);
  else process.stdout.write(`Unknown argument: ${process.argv[2]}\n`);

  process.stdout.write(`The End: ${((new Date()).getTime() - start.getTime()) / 1000} seconds\n`);
})();
