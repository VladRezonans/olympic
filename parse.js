const fs = require('fs');
const filename = process.argv[2];
const db = require('./db');
let lineEnd = '';
let start = new Date();

db.clear().then(() => {
    const stream = fs.createReadStream(filename, { encoding : 'utf8' });
    let chain = Promise.resolve();

    stream.on("readable", () => {
        let data = stream.read();

        if(data !== null) {
            let lines = (lineEnd + data).split('\n');

            lineEnd = lines[lines.length - 1];
            for(let i = 0; i < lines.length - 1; i++) {
                chain = chain.then(() => db.put(lines[i]));
            }
        }
    });

    stream.on('close', err => {
        if (err) {
            console.log(err);
        } else {
            chain = chain.then(() => {
                return db.save();
            })
            .then(() => {
                let end = new Date();
                console.log(`\nThe End: ${(end.getTime() - start.getTime())/1000} seconds`);
            });
        }
    });
});