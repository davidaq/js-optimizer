/**
 * Add additional information to the AST
 * including parent node, breadcrumb, depth, children, index
 */
module.exports = trace;

function trace(ast) {
    ast.parent = ast.parent || null;
    ast.depth = ast.depth || 0;
    ast.index = ast.index || 0;
    ast.breadcrumb = ast.breadcrumb || [];
    var stack = [ast];
    while (stack[0]) {
        var ele = stack.shift();
        if (!ele)
            break;
        var childs = childNodes[ele.type];
        if (!childs) {
            continue;
        }
        ele.children = [];
        for (var k in childs) {
            var param = childs[k];
            var child = ele[param];
            if (child) {
                if (child instanceof Array) {
                    for (var j in child) {
                        var sub = child[j];
                        sub.parent = ele;
                        sub.depth = ele.depth + 1;
                        sub.breadcrumb = ele.breadcrumb.concat([param, j]);
                        sub.index = ele.children.length;
                        ele.children.push(sub);
                        stack.push(sub);
                    }
                } else {
                    child.parent = ele;
                    child.depth = ele.depth + 1;
                    child.breadcrumb = ele.breadcrumb.concat([param]);
                    child.index = ele.children.length;
                    ele.children.push(child);
                    stack.push(child);
                }
            }
        }
    }
}

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
