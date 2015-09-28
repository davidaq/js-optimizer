var mods = [
    'parse',
    'deparse',
    'walk',
    'optimize',
];

try {
    module.exports = require('./lib/optimize');

    for (var k in mods) {
        var mod = mods[k];
        module.exports[mod] = require('./lib/' + mod);
    }
} catch(e) {
    console.warn(e.stack);
}
