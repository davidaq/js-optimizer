"use strict"
/**
 * Walk through an already traced ast,
 * can replace nodes by returning a new replacement
 * in the callback function
 */

var trace = require('./trace');

module.exports = walk;

function walk(ast, pre, post) {
    if (pre && typeof pre !== 'function') {
        throw new Error('Pre-callback must be a function');
    }
    if (post && typeof post !== 'function') {
        throw new Error('Post-callback must be a function');
    }
    var stack = [ast];
    var ret = ast;
    ret.changed = false;
    while (stack[0]) {
        var ele = stack.pop();
        if (!ele)
            break;
        if (post && ele.type == 'StackPop') {
            if(replace(ele.node, post(ele.node))) {
                ret.changed = true;
            }
        } else {
            if (pre) {
                var nele = pre(ele);
                if(replace(ele, nele)) {
                    ele = nele;
                    ret.changed = true; 
                }
            }
            if(ele === null || typeof ele !== 'object') continue;
            if (post) {
                stack.push({
                    type: 'StackPop',
                    node: ele
                });
            }
            if (ele.children) {
                for (var i = ele.children.length; i--;) {
                    stack.push(ele.children[i]);
                }
            }
        }
    }
    function replace(ele, replace) {
        if (typeof replace == 'undefined') {
            return;
        }
        if (typeof replace === 'string') {
            replace = {
                type: 'raw',
                content: replace
            };
        }
        if (typeof replace !== 'object') {
            replace = null;
        }
        if (ele.parent) {
            var k = ele.index;
            if (!(k instanceof Array)) {
                k = [k];
            }
            if (k.length > 0) {
                var o = ele.parent;
                while (k.length > 1) {
                    o = o[k.shift()];
                }
                if (replace) {
                    o[k[0]] = replace;
                } else if(o instanceof Array) {
                    o.splice(k[0], 1);
                } else {
                    o[k[0]] = null;
                }
            }
            trace(ele.parent);
        } else {
            trace(replace);
            ret = replace;
        }
        return true;
    }
    return ret;
}

