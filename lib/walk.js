/**
 * Walk through an already traced ast,
 * can replace nodes by returning a new replacement
 * in the callback function
 */

var trace = require('./trace');

module.exports = walk;

function walk(ast, cb) {
    if (typeof cb !== 'function') {
        throw new Exception('walk must take second parameter as a callback function');
    }
    var stack = [ast];
    var ret = ast;
    while (stack[0]) {
        var ele = stack.shift();
        if (!ele)
            break;
        var replace = cb(ele);
        if (replace) {
            replace.parent = ele.parent;
            replace.depth = ele.depth;
            replace.index = ele.index;
            replace.breadcrumb = ele.breadcrumb;
            trace(replace);
            if (replace.parent) {
                var d = replace.parent.breadcrumb.length;
                d -= replace.breadcrumb.length;
                var k = replace.breadcrumb.slice(d);
                if (k.length > 0) {
                    var o = replace.parent;
                    while (k.length > 1) {
                        o = o[k.shift()];
                    }
                    o[k[0]] = replace;
                }
                replace.parent.children[replace.index] = replace;
            } else {
                ret = replace;
            }
            ele = replace;
        }
        if(!ele.children)
            continue;
        for (var i = 0; i < ele.children.length; i++) {
            stack.push(ele.children[i]);
        }
    }
    return ret;
}

