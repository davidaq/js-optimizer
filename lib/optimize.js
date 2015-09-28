"use strict"
var parse = require('./parse');
var deparse = require('./deparse');
var walk = require('./walk');

module.exports = optimize;

function optimize(ast) {
    if (typeof ast == 'string') {
        ast = parse(ast);
    }
    if (ast.type != 'Program' || !ast.body[0])
        return ast;
    if (ast.body[0].type != 'ExpressionStatement' || ast.body[0].expression.type != 'Literal' || ast.body[0].expression.value != 'use strict') {
        throw new Error('Can only optimize valid strict mode script starting with "use strict"');
    }
    //=== parse scope
    while(ast.changed) {
    }
    var scopeId = 0;
    walk(ast, function(node) {
        switch(node.type) {
        case 'CatchClause':
            var vars = {};
            vars[node.param.name] = {
                constant: false,
                used: true
            };
            node.scope = {
                id: ++scopeId,
                parent: node.parent.scope,
                vars: vars
            };
            break;
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
            var literal = false;
            if (node.init && node.init.type == 'Literal') {
                literal = node.init;
            }
            node.scope.vars[node.id.name] = {
                constant: literal,
                used: false
            };
        }
    });
    function findVar(node) {
        while (node.type == 'MemberExpression') {
            node = node.object;
        }
        if (node.type == 'ThisExpression') {
            return {};
        }
        if (node.type !== 'Identifier') {
            throw new Error(node.type + " can't be resolved to variable name");
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
            if (node.parent.type == 'Property' && node.index == 'key') {
                break;
            }
            var v = findVar(node);
            if (v.constant) {
                console.log('Replace', deparse(node.parent));
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
