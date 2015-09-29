"use strict"
/**
 * Add additional information to the AST
 * including parent node, breadcrumb, depth, index
 */
module.exports = trace;

function trace(ast) {
    ast.parent = ast.parent || null;
    ast.depth = ast.depth || 0;
    ast.index = ast.index || null;
    ast.breadcrumb = ast.breadcrumb || [];
    var queue = [ast];
    while (queue.length) {
        var ele = queue.shift();
        if (!ele)
            break;
        var children = trace.children(ele);
        for (var j in children) {
            var child = children[j];
            child.parent = ele;
            child.depth = ele.depth + 1;
            child.breadcrumb = ele.breadcrumb.concat([child.index]);
            queue.push(child);
        }
    }
}

trace.children = function(ast) {
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
                    if (!child[j].index) {
                        child[j].index = [param, j];
                    }
                    ret.push(child[j]);
                }
            }
        } else if (child) {
            if (!child.index) {
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
