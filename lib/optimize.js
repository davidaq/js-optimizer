var parse = require('./parse');
var deparse = require('./deparse');
var walk = require('./walk');

module.exports = optimize;

function optimize(ast) {
    if (typeof ast == 'string') {
        ast = parse(ast);
    }
    //=== parse scope
    var scopeId = 0;
    walk(ast, function(node) {
        switch(node.type) {
        case 'FunctionDeclaration':
        case 'FunctionExpression':
            var vars = {};
            for (var k in node.params) {
                vars[node.params[k].name] = {
                    constant: false,
                    used: true
                };
            }
            if (node.type == 'FunctionDeclaration') {
                node.parent.scope.vars[node.id.name] = {
                    constant: false,
                    used: false
                };
            } else if(node.id) {
                vars[node.id.name] = {
                    constant: false,
                    used: false
                };
            }
            node.declareScope = {
                id: ++scopeId,
                parent: node.parent.scope,
                vars: vars
            };
        default:
            if (node.parent) {
                node.scope = node.parent.declareScope || node.parent.scope;
            } else {
                node.scope = {
                    id: 0,
                    parent: null,
                    vars: {}
                };
            }
            break;
        }
    }, function(node) {
        if (node.type == 'VariableDeclarator') {
            node.scope.vars[node.id.name] = {
                constant: node.init || false,
                used: false
            };
        }
    });
    function findVar(node) {
        if (node.type !== 'Identifier') {
            throw new Error('Only Identifiers can be found as a variable');
        }
        var scope = node.scope;
        while(scope) {
            if (scope.vars[node.name]) {
                return scope.vars[node.name];
            }
            scope = scope.parent;
        }
        return {};
    }
    //=== detect constants
    walk(ast, function(node) {
        console.log('\t\t\t\t\t\t\t\t\t\t'.substr(0, node.depth), node.type, '\t', node.breadcrumb.join('.'));
        switch(node.type) {
        case 'AssignmentExpression':
            findVar(node.left).constant = false;
            break;
        case 'UpdateExpression':
            findVar(node.argument).constant = false;
            break;
        }
    });
    //=== replace constant and calculate literal expressions
    walk(ast, null, function(node) {
        switch(node.type) {
        case 'Identifier':
            var v = findVar(node);
            if (v.constant) {
                console.log('Replace constant', deparse(node.parent));
                return v.constant;
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
