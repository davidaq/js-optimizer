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
        throw new Error('Parse error, line ' + e.lineNumber + ': ' + e.description);
    }
    trace(ast);
    return ast;
}

