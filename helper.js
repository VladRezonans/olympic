function strip (params) {
    let result = [];

    for(let param of params) {
        if (param !== undefined) {
            result.push(unquotes(param).trim());
        }
    }

    return result;
}

function unquotes (str) {
    let start = 0;
    let end = str.length - 1;

    if(str[start] === '"') start++;
    if(str[end] === '"') end--;

    return str.substring(start, end + 1);
}

const hashToText = (params) => {
    let result = [];

    Object.keys(params).forEach(function(key) {
        if (params[key] !== 'NA') {
            result.push(`${key}: ${params[key]}`);
        }
    });

    return `{${result.join(', ')}}`;
};

const removeSuffix = (str) => str.replace(/-[0-9]$/, '');
const removeTagged = (str) => str.replace(/(\"+)(.*)(\"+)/g, '').replace(/\((.*)\)/g, '');

const parse = (line) => {
    const bufLine = line.substring(0, line.length - 1);
    const bp = bufLine.split('",');
    const ad = bp[3].split(',');
    const year = bp[6].split(',');
    const params = [bp[0], bp[1], bp[2], ad[0], ad[1], ad[2], ad[3], bp[4], bp[5], year[0], year[1], bp[7], bp[8],
        bp[9], bp[10]];

    return strip(params);
};

module.exports = {
  parse,
  hashToText,
  removeTagged,
  removeSuffix
};
