#!/usr/bin/env node

var esprima = require('esprima');
var fs = require('fs');

//var script = fs.readFileSync('example.js').toString();
var script = fs.readFileSync('/Users/apple/Documents/workspace/mikoto-web/public/dixie.js').toString();

function walk(ast, cb) {
    var stack = [ast];
    while (stack[0]) {
        var ele = stack.shift();
        if (!ele)
            break;
        if(ele.body) {
            if (ele.body instanceof Array) {
                for (var k in ele.body) {
                    ele.body[k].parentNode = ele;
                    stack.push(ele.body[k]);
                }
            } else {
                ele.body.parentNode = ele;
                stack.push(ele.body);
            }
        }
        cb(ele);
    }
}

//walk(script, function(node) {
//    console.log(node.type);
//    if(node.type=='ExpressionStatement') {
//        console.log(node);
//    }
//});

function deparse(ast) {
    if (!ast)
        return '';
    if(deparse[ast.type]) {
        return deparse[ast.type](ast);
    } else {
        console.warn('Unrecognized node type:', ast, '\n');
        if (ast.range) {
            console.log(script.substr(ast.range[0], ast.range[1] - ast.range[0]));
        }
        return '/*Error*/ ';
    }
}

deparse.join = function(array, sep) {
    var list = [];
    for (var k in array) {
        list.push(deparse(array[k]));
    }
    return list.join(sep);
};

deparse.Program = function(ast) {
    return deparse.join(ast.body, '');
};

deparse.FunctionDeclaration = function(ast) {
    var ret = 'function ';
    ret += deparse(ast.id);
    ret += '(' + deparse.join(ast.params, ',') + ')';
    ret += deparse(ast.body);
    return ret;
};

deparse.FunctionExpression = function(ast) {
    return '(' + deparse.FunctionDeclaration(ast) + ')'
};

deparse.BlockStatement = function(ast) {
    return '{' + deparse.join(ast.body, '') + '}';
};

deparse.ExpressionStatement = function(ast) {
    return deparse(ast.expression) + ';';
};

deparse.SequenceExpression = function(ast) {
    return deparse.join(ast.expressions, ',');
};

deparse.MemberExpression = function(ast) {
    if(ast.computed)
        return deparse(ast.object) + '[' + deparse(ast.property) + ']';
    return deparse(ast.object) + '.' + deparse(ast.property);
};

deparse.CallExpression = function(ast) {
    ret = deparse(ast.callee);
    ret += '(' + deparse.join(ast.arguments, ',') + ')';
    return ret;
};

deparse.NewExpression = function(ast) {
    return 'new ' + deparse.CallExpression(ast);
};

deparse.VariableDeclaration = function(ast) {
    return ast.kind + ' ' + deparse.join(ast.declarations, ',') + ';'; 
};

deparse.AssignmentExpression = function(ast) {
    return deparse(ast.left) + ast.operator + deparse(ast.right);
};

deparse.ConditionalExpression = function(ast) {
    var ret = deparse(ast.test) + '?';
    ret += deparse(ast.consequent) + ':';
    ret += deparse(ast.alternate);
    return ret;
};

deparse.UnaryExpression = function(ast) {
    if(ast.prefix) {
        return '(' + ast.operator + deparse(ast.argument) + ')';
    } else {
        return '(' + deparse(ast.argument) + ast.operator + ')';
    }
};

deparse.LogicalExpression = function(ast) {
    return '(' + deparse(ast.left) + ast.operator + deparse(ast.right) + ')';
};

deparse.BinaryExpression = function(ast) {
    return '(' + deparse(ast.left) + ast.operator + deparse(ast.right) + ')';
};

deparse.UpdateExpression = function(ast) {
    if(ast.prefix) {
        return '(' + ast.operator + deparse(ast.argument) + ')';
    } else {
        return '(' + deparse(ast.argument) + ast.operator + ')';
    }
};

deparse.BreakStatement = function(ast) {
    return 'break;';
};

deparse.ContinueStatement = function(ast) {
    return 'continue;';
};

deparse.ReturnStatement = function(ast) {
    return 'return ' + deparse(ast.argument) + ';';
};

deparse.VariableDeclarator = function(ast) {
    if (ast.init)
        return deparse(ast.id) + '=' + deparse(ast.init);
    return deparse(ast.id);
};

deparse.Identifier = function(ast) {
    return ast.name || '';
};

deparse.ArrayExpression = function(ast) {
    return '[' + deparse.join(ast.elements, ',') + ']';
};

deparse.ObjectExpression = function(ast) {
    return '{' + deparse.join(ast.properties, ',') + '}';
};

deparse.Property = function(ast) {
    return deparse(ast.key) + ':' + deparse(ast.value);
};

deparse.Literal = function(ast) {
    return ast.raw;
};

deparse.SwitchStatement = function(ast) {
    var ret = 'switch(';
    ret += deparse(ast.discriminant);
    ret += ') {' + deparse.join(ast.cases, '') + '}';
    return ret;
};

deparse.SwitchCase = function(ast) {
    var ret;
    if (ast.test) {
        ret = 'case ' + deparse(ast.test) + ':';
    } else {
        ret = 'default:';
    }
    ret += deparse.join(ast.consequent, '');
    return ret;
};

deparse.IfStatement = function(ast) {
    var ret = 'if(';
    ret += deparse(ast.test);
    ret += ')';
    ret += deparse(ast.consequent);
    if(ast.alternate) {
        ret += 'else ';
        ret += deparse(ast.alternate);
    }
    return ret;
};

deparse.WhileStatement = function(ast) {
    var ret = 'while(';
    ret += deparse(ast.test);
    ret += ')';
    ret += deparse(ast.body);
    return ret;
};

deparse.DoWhileStatement = function(ast) {
    var ret = 'do';
    ret += deparse(ast.body);
    ret += 'while(';
    ret += deparse(ast.test);
    ret += ')';
    return ret;
};

deparse.ForStatement = function(ast) {
    var ret = 'for(';
    ret += deparse(ast.init) + ';';
    ret += deparse(ast.test) + ';';
    ret += deparse(ast.update);
    ret += ')';
    ret += deparse(ast.body);
    return ret;
};

deparse.ForInStatement = function(ast) {
    var ret = 'for(';
    ret += deparse(ast.left);
    ret += ' in ';
    ret += deparse(ast.right);
    ret += ')';
    ret += deparse(ast.body);
    return ret;
};

deparse.TryStatement = function(ast) {
    var ret = 'try ';
    ret += deparse(ast.block);
    if(ast.handler) {
        ret += 'catch(' + deparse(ast.handler.param) + ')';
        ret += deparse(ast.handler.body);
    }
    if(ast.finalizer) {
        ret += 'finally';
        ret += deparse(ast.handler.body);
    }
    return ret;
};

deparse.ThisExpression = function(ast) {
    return 'this';
};

deparse.EmptyStatement = function(ast) {
    return ';';
};

var ast = esprima.parse(script, {
    range: true
});
console.log(deparse(ast));
