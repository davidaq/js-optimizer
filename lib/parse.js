/**
 * Parse script string to ast, and trace ast
 */

var esprima = require('esprima');
var trace = require('./trace');

module.exports = parse;

function parse(script) {
    var ast = esprima.parse(script);
    trace(ast);
    return ast;
}

