
var mods = [
    'parse',
    'deparse',
    'walk',
    'optimize',
];

for (var k in mods) {
    var mod = mods[k];
    exports[mod] = require('./lib/' + mod);
}
