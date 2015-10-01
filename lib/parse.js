/**
 * Parse script string to ast, and trace ast
 */

var esprima = require('esprima');
var trace = require('./trace');

module.exports = parse;

function parse(script) {
    try {
        var ast = esprima.parse(script);
    } catch(e) {
        var err = new Error('Parse error, line ' + e.lineNumber + ': ' + e.description);
        err.stack = err.message + "\n\t";
        err.stack += script.split("\n")[e.lineNumber - 1];
        throw err;
    }
    trace(ast);
    return ast;
}

