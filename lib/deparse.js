"use strict"
/**
 * Transform a parsed AST back to executable JavaScript string
 */
var walk = require('./walk');

module.exports = deparse;

function deparse(ast) {
    if (!ast)
        return '';
    if(deparse[ast.type]) {
        return deparse[ast.type](ast);
    } else {
        console.warn('Unrecognized node type:', ast, '\n');
        return '/*Error*/ ';
    }
}

deparse.join = function(array, sep) {
    var list = [];
    for (var i = 0; i < array.length; i++) {
        if(array[i]) list.push(deparse(array[i]));
    }
    return list.join(sep);
};

deparse.Program = function(ast) {
    return deparse.join(ast.body, '');
};

deparse.raw = function(ast) {
    return ast.content;
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
    var ret = deparse(ast.callee);
    ret += '(' + deparse.join(ast.arguments, ',') + ')';
    return ret;
};

deparse.NewExpression = function(ast) {
    return 'new ' + deparse.CallExpression(ast);
};

deparse.VariableDeclaration = function(ast) {
    if (ast.declarations.length == 0)
        return '';
    var ret = ast.kind + ' ' + deparse.join(ast.declarations, ',');
    if (ast.parent && ast.parent.type in {Program:1, BlockStatement:1}) {
        ret += ';';
    }
    return ret;
};

deparse.VariableDeclarator = function(ast) {
    if (ast.init)
        return deparse(ast.id) + '=' + deparse(ast.init);
    return deparse(ast.id);
};

deparse.BinaryExpression = function(ast) {
    return '(' + deparse(ast.left) + ast.operator + deparse(ast.right) + ')';
};

deparse.LogicalExpression = function(ast) {
    return '(' + deparse(ast.left) + ast.operator + deparse(ast.right) + ')';
};

deparse.AssignmentExpression = function(ast) {
    return deparse(ast.left) + ast.operator + deparse(ast.right);
};

deparse.UnaryExpression = function(ast) {
    if(ast.prefix) {
        return '(' + ast.operator + deparse(ast.argument) + ')';
    } else {
        return '(' + deparse(ast.argument) + ast.operator + ')';
    }
};

deparse.UpdateExpression = function(ast) {
    if(ast.prefix) {
        return '(' + ast.operator + deparse(ast.argument) + ')';
    } else {
        return '(' + deparse(ast.argument) + ast.operator + ')';
    }
};

deparse.ConditionalExpression = function(ast) {
    var ret = deparse(ast.test) + '?';
    ret += deparse(ast.consequent) + ':';
    ret += deparse(ast.alternate);
    return ret;
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

deparse.ThrowStatement = function(ast) {
    return 'throw ' + deparse(ast.argument) + ';';
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
    ret += ');';
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
    ret += deparse.join(ast.handlers, '');
    if(ast.finalizer) {
        ret += 'finally';
        ret += deparse(ast.finalizer);
    }
    return ret;
};

deparse.CatchClause = function(ast) {
    var ret = 'catch(' + deparse(ast.param) + ')';
    ret += deparse(ast.body);
    return ret;
};

deparse.WithStatement = function(ast) {
    return 'with (' + deparse(ast.object) + ')' + deparse(ast.body);
};

deparse.ThisExpression = function(ast) {
    return 'this';
};

deparse.EmptyStatement = function(ast) {
    return ';';
};
