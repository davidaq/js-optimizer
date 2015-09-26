var parse = require('./parse');
var deparse = require('./deparse');
var walk = require('./walk');

module.exports = optimize;

function optimize(ast) {
    if (typeof ast == 'string') {
        ast = parse(ast);
    }
    ast = walk(ast, function(node) {
        console.log(node.type, node.breadcrumb.join('/'));
        if (node.type == 'Literal' && node.value == 0) {
            return parse('(function() {return 1})()');
        }
    });
    //console.log(ast.body[0].block.body[0].declarations[0]);
    return deparse(ast);
}
