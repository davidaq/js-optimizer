"use strict"
/**
 * Add additional information to the AST
 * including parent node, breadcrumb, depth, index
 */
module.exports = trace;

function trace(ast, shallow) {
    ast.parent = ast.parent || null;
    ast.depth = ast.depth || 0;
    ast.index = ast.index || null;
    var queue = [ast];
    do {
        var ele = queue.pop();
        if (!ele)
            break;
        var children = trace.children(ele, true);
        for (var j in children) {
            var child = children[j];
            child.parent = ele;
            child.depth = ele.depth + 1;
            queue.push(child);
        }
    } while (queue.length && !shallow);
}

trace.breadcrumb = function(ast) {
    if (!ast || !ast.index || !ast.parent) {
        return [];
    }
    return trace.breadcrumb(ast.parent).concat(ast.index);
};

trace.children = function(ast, index) {
    if (!ast)
        return [];
    var childs = childNodes[ast.type];
    if (!childs) {
        return [];
    }
    var ret = [];
    for (var k in childs) {
        var param = childs[k];
        var child = ast[param];
        if (child instanceof Array) {
            for (var j = 0; j < child.length; j++) {
                if (child[j]) {
                    if (index) {
                        child[j].index = [param, j];
                    }
                    ret.push(child[j]);
                }
            }
        } else if (child) {
            if (index) {
                child.index = [param];
            }
            ret.push(child);
        }
    }
    return ret;
};

var childNodes = {};
childNodes.Program = ['body'];
childNodes.FunctionDeclaration = ['id','params','body'];
childNodes.FunctionExpression = childNodes.FunctionDeclaration;
childNodes.BlockStatement = ['body'];
childNodes.ExpressionStatement = ['expression'];
childNodes.SequenceExpression = ['expressions'];
childNodes.MemberExpression = ['object','property'];
childNodes.CallExpression = ['callee','arguments'];
childNodes.NewExpression = childNodes.CallExpression;
childNodes.VariableDeclaration = ['declarations'];
childNodes.VariableDeclarator = ['id','init'];
childNodes.BinaryExpression = ['left','right'];
childNodes.LogicalExpression = childNodes.BinaryExpression;
childNodes.AssignmentExpression = childNodes.BinaryExpression;
childNodes.UnaryExpression = ['argument'];
childNodes.UpdateExpression = childNodes.UnaryExpression;
childNodes.ConditionalExpression = ['test','consequent','alternate'];
childNodes.ReturnStatement = ['argument'];
childNodes.ThrowStatement = ['argument'];
childNodes.ArrayExpression = ['elements'];
childNodes.ObjectExpression = ['properties'];
childNodes.Property = ['key','value'];
childNodes.SwitchStatement = ['discriminant','cases'];
childNodes.SwitchCase = ['test','consequent'];
childNodes.IfStatement = ['test','consequent','alternate'];
childNodes.WhileStatement = ['test','body'];
childNodes.DoWhileStatement = ['body','test'];
childNodes.ForStatement = ['init','test','update','body'];
childNodes.ForInStatement = ['left','right','body'];
childNodes.TryStatement = ['block','handlers','finalizer'];
childNodes.CatchClause = ['param','body'];
childNodes.WithStatement = ['object','body'];
