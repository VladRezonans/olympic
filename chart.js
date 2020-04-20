// 'NOC Amount', [["USA", 50], ["RUS", 30], ["UGA", 10]]
const maxRectangle = 190;
const build = (head, params) => {
  const max = Math.max(...params.map((p) => p[1]));
  const k = (max > maxRectangle) ? max / maxRectangle : 1;

  process.stdout.write(head);
  params.forEach((param) => {
    let bar = '';
    process.stdout.write(`\n${param[0]} `);
    for (let i = 0; i < param[1] / k; i += 1) bar += '█';
    process.stdout.write(`${bar}`);
  });
  process.stdout.write('\n');
};

module.exports = {
  build,
};
