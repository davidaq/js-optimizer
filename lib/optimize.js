"use strict"
var parse = require('./parse');
var deparse = require('./deparse');
var walk = require('./walk');
var trace = require('./trace');

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

    var strict = ast.body.shift();
    ast.body.unshift(parse('var undefined').body[0]);
    ast.body.unshift(strict);
    trace(ast, true);

    ast = replaceArrayConstructor(ast);
    dump(ast);
    do {
        var changed = false;
        changed = (ast = parseScope(ast)).changed || changed;
        changed = (ast = detectConstant(ast)).changed || changed;
        changed = (ast = evaluateLiteral(ast)).changed || changed;
        changed = (ast = reduceBlocks(ast)).changed || changed;
        changed = (ast = removeDeadCode(ast)).changed || changed;
        changed = (ast = inlineFunctions(ast)).changed || changed;
    } while(changed);
    dump(ast);
    return deparse(ast);
}

function dump(ast) {
    return;
    walk(ast, function(node) {
        var indent = '';
        for (var i = 0; i < node.depth; i++)
            indent += '   ';
        console.warn(indent, node.type, '\t', trace.breadcrumb(node).join('/'));
    });
}

function replaceArrayConstructor(ast) {
    return walk(ast, function(node) {
        if (node.type == 'NewExpression' && node.callee && node.callee.name == 'Array') {
            if (node.arguments.length == 0) {
                return {
                    type: 'ArrayExpression',
                    elements: []
                };
            }
            if (node.arguments.length > 1 || typeof node.arguments[0].value == 'string') {
                return {
                    type: 'ArrayExpression',
                    elements: node.arguments
                };
            }
        }
    });
}

function parseScope(ast) {
    var scopeId = 0;
    return walk(ast, function(node) {
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
                    used: false
                };
            }
            if (node.type == 'FunctionDeclaration') {
                node.parent.scope.vars[node.id.name] = {
                    constant: false,
                    used: !node.parent.scope.parent
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
            if (node.scope.parent && node.init && node.init.type == 'Literal') {
                literal = node.init;
            }
            node.scope.vars[node.id.name] = {
                constant: literal,
                used: !node.scope.parent
            };
        }
    });
}

function detectConstant(ast) {
    return walk(ast, null, function(node) {
        switch(node.type) {
        case 'AssignmentExpression':
            findVar(node.left).constant = false;
            break;
        case 'UpdateExpression':
            findVar(node.argument).constant = false;
            break;
        case 'FunctionDeclaration':
        case 'FunctionExpression':
            var changed = false;
            var k;
            for (k = node.params.length - 1; k >= 0; k--) {
                if (findVar(node.params[k]).used) {
                    break;
                }
                changed = true;
            }
            if (changed) {
                node.params.splice(k + 1);
            }
            // try to evaluate potential constant 
            if (node.params.length == 0) {
                try {
                    var result = calc({
                        type: 'CallExpression',
                        callee: {
                            type: 'FunctionExpression',
                            params: [],
                            body: node.body
                        },
                        arguments: []
                    });
                    if (typeof result === 'undefined') {
                        node.inline = {
                            type: 'Literal',
                            raw: 'undefined',
                            value: undefined
                        };
                    } else {
                        node.inline = parse(JSON.stringify(result)).body[0].expression;
                    }
                    if (node.body)
                        node.body.body = [{
                            type: 'ReturnStatement',
                            argument: node.inline
                        }];
                    if(node.id) {
                        findVar(node.id).inline = node.inline;
                        console.warn('inline constant function', node.id.name, result);
                    }
                } catch(e) { }
            }
            if (changed) {
                return node;
            }
            break;
        }
        var svar = findVar(node);
        if ('used' in svar && !svar.used) {
            if (node.parent && node.index) {
                var ptype = node.parent.type;
                var index = node.index[0];
                var isStatement = node.parent.parent && node.parent.parent.type == 'ExpressionStatement';
                switch(ptype) {
                case 'FunctionDeclaration':
                case 'FunctionExpression':
                    if (index == 'params' || index == 'id') {
                        return;
                    }
                    break;
                case 'VariableDeclarator':
                    if (index == 'id') {
                        return;
                    }
                    break;
                case 'AssignmentExpression':
                    if (index == 'left' && isStatement) {
                        return;
                    }
                    break;
                case 'UpdateExpression':
                    if (index == 'argument' && isStatement) {
                        return;
                    }
                    break;
                }
            }
            svar.used = true;
        }
    });
}

function evaluateLiteral(ast) {
    return walk(ast, null, function(node) {
        switch(node.type) {
        case 'Identifier':
            if (node.parent.type == 'VariableDeclarator' && node.index == 'id') {
                break;
            }
            if (node.parent.type == 'Property' && node.index == 'key') {
                break;
            }
            var v = findVar(node);
            if (v.constant) {
                console.warn('Replace', deparse(node.parent));
                return v.constant;
            }
            break;
        case 'FunctionDeclaration':
        case 'VariableDeclarator':
            if (!findVar(node.id).used) {
                return null;
            }
            break;
        case 'VariableDeclaration':
            if (node.declarations.length == 0) {
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
}

function reduceBlocks(ast) {
    return walk(ast, null, function(node) {
        if (node.type in {BlockStatement:1, Program:1}) {
            var nbody;
            for (var i = 0; i < node.body.length; i++) {
                var stmt = node.body[i];
                if (!stmt)
                    continue;
                if (stmt.type == 'BlockStatement' || stmt.type == 'EmptyStatement') {
                    if (!nbody) {
                        nbody = node.body.slice(0, i);
                    }
                    if (stmt.type == 'BlockStatement') {
                        for (var j = 0; j < stmt.body.length; j++) {
                            nbody.push(stmt.body[j]);
                        }
                    }
                } else if (nbody && stmt.type != 'EmptyStatement') {
                    nbody.push(stmt);
                }
            }
            if (nbody) {
                node.body = nbody;
                return node;
            }
        }
    });
}

function removeDeadCode(ast) {
    var esc = {
        'BreakStatement': 1,
        'ContinueStatement': 1,
        'ReturnStatement': 1,
        'ThrowStatement': 1
    };
    return walk(ast, function(node) {
        switch(node.type) {
        case 'BlockStatement':
            var ret;
            for (var i = 0; i < node.body.length - 1; i++) {
                var stmt = node.body[i];
                if (stmt && stmt.type in esc) {
                    node.body.splice(i + 1);
                    ret = node;
                    break;
                }
            }
            return ret;
        case 'IfStatement':
            if (node.test.type == 'Literal') {
                if (node.test.value) {
                    return node.consequent;
                } else {
                    return node.alternate;
                }
            }
            break;
        case 'WhileStatement':
            if (node.test.type == 'Literal' && !node.test.value) {
                return null;
            }
            break;
        case 'DoWhileStatement':
            if (node.test.type == 'Literal' && !node.test.value) {
                return node.body;
            }
            break;
        case 'ExpressionStatement':
            if (node.expression.type == 'Literal') {
                if(typeof node.expression.value == 'string' && node.expression.value.substr(0, 3) == 'use') {
                    return;
                }
                return null;
            }
            break;
        case 'FunctionDeclaration':
            if (!findVar(node.id).used) {
                return null;
            }
        case 'FunctionExpression':
            var bodyLen = 0;
            if (node.body.type == 'BlockStatement') {
                bodyLen = node.body.body;
            }
            if (bodyLen == 0) {
                node.inline = {
                    type: 'Literal',
                    value: null,
                    raw: 'null'
                };
                if (node.id) {
                    findVar(node.id).inline = node.inline;
                }
            }
            break;
        };
    });
}

function inlineFunctions(ast) {
    return walk(ast, function(node) {
        switch(node.type) {
        case 'CallExpression':
            var inline = node.callee.inline || findVar(node.callee).inline;
            if (inline) {
                return inline;
            }
            break;
        };
    });
}


function findVar(node) {
    if (node.type != 'Identifier' || (node.parent && node.parent.type == 'Property' && node.index && node.index[0] == 'key')) {
        return {};
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

var vm = require('vm');
function calc(ast) {
    var script = deparse(ast);
    var context = {};
    return vm.runInNewContext(script, context, {timeout:100});
}
