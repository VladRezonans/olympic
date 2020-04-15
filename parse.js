const fs = require('fs');

const filename = process.argv[2];
const db = require('./db');

let lineEnd = '';
const start = new Date();

(async () => {
  await db.clear();

  const stream = fs.createReadStream(filename, { encoding: 'utf8' });
  let chain = Promise.resolve();

  stream.on('readable', () => {
    const data = stream.read();

    if (data !== null) {
      const lines = (lineEnd + data).split('\n');

      lineEnd = lines[lines.length - 1];
      for (let i = 0; i < lines.length - 1; i += 1) {
        chain = chain.then(() => db.put(lines[i]));
      }
    }
  });

  stream.on('close', (err) => {
    if (err) {
      process.stdout.write(`\n${err}`);
    } else {
      chain = chain.then(() => db.save())
        .then(() => {
          process.stdout.write(`\nThe End: ${((new Date()).getTime() - start.getTime()) / 1000} seconds\n`);
        });
    }
  });
})();
