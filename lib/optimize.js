var parse = require('./parse');
var deparse = require('./deparse');
var walk = require('./walk');

module.exports = optimize;

function optimize(ast) {
    if (typeof ast == 'string') {
        ast = parse(ast);
    }
    var constants = {};
    walk(ast, function(node) {
        console.log('\t\t\t\t\t\t\t\t\t\t'.substr(0, node.depth), node.type, '\t', node.breadcrumb.join('.'));
        switch(node.type) {
        case 'VariableDeclarator':
            if (node.init && node.init.type == 'Literal') {
                constants[node.id.name] = node.init;
            }
            break;
        case 'AssignmentExpression':
            delete constants[node.left.name];
            break;
        case 'UpdateExpression':
            delete constants[node.argument.name];
            break;
        }
    });
    console.log(Object.keys(constants));
    walk(ast, null, function(node) {
        switch(node.type) {
        case 'Identifier':
            if (constants[node.name]) {
                return constants[node.name];
            }
            break;
        case 'VariableDeclarator':
            if (node.id.type == 'Literal') {
                return null;
            }
            break;
        case 'BinaryExpression':
            if (node.left.type == 'Literal' && node.right.type == 'Literal') {
                var val = eval(deparse(node));
                return {
                    type: 'Literal',
                    value: val,
                    raw: JSON.stringify(val)
                };
            }
            break;
        }
    });
    //console.log(ast.body[0].block.body[0].declarations[0]);
    return deparse(ast);
}
