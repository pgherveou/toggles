
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("discore-closest/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
module.exports = function (element, selector, checkYoSelf, root) {\n\
  element = checkYoSelf ? {parentNode: element} : element\n\
\n\
  root = root || document\n\
\n\
  // Make sure `element !== document` and `element != null`\n\
  // otherwise we get an illegal invocation\n\
  while ((element = element.parentNode) && element !== document) {\n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return  \n\
  }\n\
}//@ sourceURL=discore-closest/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var closest = require('closest')\n\
  , event = require('event');\n\
\n\
/**\n\
 * Delegate event `type` to `selector`\n\
 * and invoke `fn(e)`. A callback function\n\
 * is returned which may be passed to `.unbind()`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, selector, type, fn, capture){\n\
  return event.bind(el, type, function(e){\n\
    var target = e.target || e.srcElement;\n\
    e.delegateTarget = closest(target, selector, true, el);\n\
    if (e.delegateTarget) fn.call(el, e);\n\
  }, capture);\n\
};\n\
\n\
/**\n\
 * Unbind event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  event.unbind(el, type, fn, capture);\n\
};\n\
//@ sourceURL=component-delegate/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
  return exports;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("component-has-translate3d/index.js", Function("exports, require, module",
"\n\
var prop = require('transform-property');\n\
// IE8<= doesn't have `getComputedStyle`\n\
if (!prop || !window.getComputedStyle) return module.exports = false;\n\
\n\
var map = {\n\
  webkitTransform: '-webkit-transform',\n\
  OTransform: '-o-transform',\n\
  msTransform: '-ms-transform',\n\
  MozTransform: '-moz-transform',\n\
  transform: 'transform'\n\
};\n\
\n\
// from: https://gist.github.com/lorenzopolidori/3794226\n\
var el = document.createElement('div');\n\
el.style[prop] = 'translate3d(1px,1px,1px)';\n\
document.body.insertBefore(el, null);\n\
var val = getComputedStyle(el).getPropertyValue(map[prop]);\n\
document.body.removeChild(el);\n\
module.exports = null != val && val.length && 'none' != val;\n\
//@ sourceURL=component-has-translate3d/index.js"
));
require.register("component-transform-property/index.js", Function("exports, require, module",
"\n\
var styles = [\n\
  'webkitTransform',\n\
  'MozTransform',\n\
  'msTransform',\n\
  'OTransform',\n\
  'transform'\n\
];\n\
\n\
var el = document.createElement('p');\n\
var style;\n\
\n\
for (var i = 0; i < styles.length; i++) {\n\
  style = styles[i];\n\
  if (null != el.style[style]) {\n\
    module.exports = style;\n\
    break;\n\
  }\n\
}\n\
//@ sourceURL=component-transform-property/index.js"
));
require.register("component-translate/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var transform = require('transform-property');\n\
var has3d = require('has-translate3d');\n\
\n\
/**\n\
 * Expose `translate`.\n\
 */\n\
\n\
module.exports = translate;\n\
\n\
/**\n\
 * Translate `el` by `(x, y)`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Number} x\n\
 * @param {Number} y\n\
 * @api public\n\
 */\n\
\n\
function translate(el, x, y){\n\
  if (transform) {\n\
    if (has3d) {\n\
      el.style[transform] = 'translate3d(' + x + 'px,' + y + 'px, 0)';\n\
    } else {\n\
      el.style[transform] = 'translate(' + x + 'px,' + y + 'px)';\n\
    }\n\
  } else {\n\
    el.style.left = x + 'px';\n\
    el.style.top = y + 'px';\n\
  }\n\
};\n\
//@ sourceURL=component-translate/index.js"
));
require.register("pgherveou-prefix/index.js", Function("exports, require, module",
"// module globals\n\
\n\
var prefixes = ['webkit','Moz','ms','O']\n\
  , len = prefixes.length\n\
  , p = document.createElement('p')\n\
  , style = p.style\n\
  , capitalize = function (str) {return str.charAt(0).toUpperCase() + str.slice(1);}\n\
  , dasherize = function(str) {\n\
      return str.replace(/([A-Z])/g, function(str,m1) {\n\
        return '-' + m1.toLowerCase();\n\
      });\n\
    };\n\
\n\
// nullify p to release dom node\n\
p = null;\n\
\n\
/**\n\
 * get prefix for dom style\n\
 *\n\
 * example\n\
 *   prefix('transform') // webkitTransform\n\
 *   prefix('transform', true) // -webkit-transform\n\
 *\n\
 * @param  {String}   ppty dom style\n\
 * @param  {Boolean}  dasherize\n\
 * @return {String}   prefixed ppty\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(ppty, dasherized) {\n\
  var Ppty, name, Name;\n\
\n\
  // test without prefix\n\
  if (style[ppty] !== undefined) {\n\
    if (!dasherized) return ppty;\n\
    return dasherize(ppty);\n\
  }\n\
\n\
  // test with prefix\n\
  Ppty = capitalize(ppty);\n\
  for (i = 0; i < len; i++) {\n\
    name = prefixes[i] + Ppty;\n\
    if (style[name] !== undefined) {\n\
      if (!dasherized) return name;\n\
      return '-' + prefixes[i].toLowerCase() + '-' + dasherize(ppty);\n\
    }\n\
  }\n\
\n\
  // not found return empty string\n\
  return '';\n\
};\n\
//@ sourceURL=pgherveou-prefix/index.js"
));
require.register("pgherveou-transitionend/index.js", Function("exports, require, module",
"/**\n\
 * module dependencies\n\
 */\n\
\n\
var prefix = require('prefix');\n\
\n\
// transitionend mapping\n\
// src: https://github.com/twitter/bootstrap/issues/2870\n\
\n\
var transEndEventNames = {\n\
    'webkitTransition' : 'webkitTransitionEnd',\n\
    'WebkitTransition' : 'webkitTransitionEnd',\n\
    'MozTransition'    : 'transitionend',\n\
    'OTransition'      : 'oTransitionEnd',\n\
    'msTransition'     : 'MSTransitionEnd',\n\
    'transition'       : 'transitionend'\n\
};\n\
\n\
module.exports = transEndEventNames[prefix('transition')];//@ sourceURL=pgherveou-transitionend/index.js"
));
require.register("ftlabs-fastclick/lib/fastclick.js", Function("exports, require, module",
"/**\n\
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.\n\
 *\n\
 * @version 0.6.11\n\
 * @codingstandard ftlabs-jsv2\n\
 * @copyright The Financial Times Limited [All Rights Reserved]\n\
 * @license MIT License (see LICENSE.txt)\n\
 */\n\
\n\
/*jslint browser:true, node:true*/\n\
/*global define, Event, Node*/\n\
\n\
\n\
/**\n\
 * Instantiate fast-clicking listeners on the specificed layer.\n\
 *\n\
 * @constructor\n\
 * @param {Element} layer The layer to listen on\n\
 */\n\
function FastClick(layer) {\n\
\t'use strict';\n\
\tvar oldOnClick, self = this;\n\
\n\
\n\
\t/**\n\
\t * Whether a click is currently being tracked.\n\
\t *\n\
\t * @type boolean\n\
\t */\n\
\tthis.trackingClick = false;\n\
\n\
\n\
\t/**\n\
\t * Timestamp for when when click tracking started.\n\
\t *\n\
\t * @type number\n\
\t */\n\
\tthis.trackingClickStart = 0;\n\
\n\
\n\
\t/**\n\
\t * The element being tracked for a click.\n\
\t *\n\
\t * @type EventTarget\n\
\t */\n\
\tthis.targetElement = null;\n\
\n\
\n\
\t/**\n\
\t * X-coordinate of touch start event.\n\
\t *\n\
\t * @type number\n\
\t */\n\
\tthis.touchStartX = 0;\n\
\n\
\n\
\t/**\n\
\t * Y-coordinate of touch start event.\n\
\t *\n\
\t * @type number\n\
\t */\n\
\tthis.touchStartY = 0;\n\
\n\
\n\
\t/**\n\
\t * ID of the last touch, retrieved from Touch.identifier.\n\
\t *\n\
\t * @type number\n\
\t */\n\
\tthis.lastTouchIdentifier = 0;\n\
\n\
\n\
\t/**\n\
\t * Touchmove boundary, beyond which a click will be cancelled.\n\
\t *\n\
\t * @type number\n\
\t */\n\
\tthis.touchBoundary = 10;\n\
\n\
\n\
\t/**\n\
\t * The FastClick layer.\n\
\t *\n\
\t * @type Element\n\
\t */\n\
\tthis.layer = layer;\n\
\n\
\tif (!layer || !layer.nodeType) {\n\
\t\tthrow new TypeError('Layer must be a document node');\n\
\t}\n\
\n\
\t/** @type function() */\n\
\tthis.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };\n\
\n\
\t/** @type function() */\n\
\tthis.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };\n\
\n\
\t/** @type function() */\n\
\tthis.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };\n\
\n\
\t/** @type function() */\n\
\tthis.onTouchMove = function() { return FastClick.prototype.onTouchMove.apply(self, arguments); };\n\
\n\
\t/** @type function() */\n\
\tthis.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };\n\
\n\
\t/** @type function() */\n\
\tthis.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };\n\
\n\
\tif (FastClick.notNeeded(layer)) {\n\
\t\treturn;\n\
\t}\n\
\n\
\t// Set up event handlers as required\n\
\tif (this.deviceIsAndroid) {\n\
\t\tlayer.addEventListener('mouseover', this.onMouse, true);\n\
\t\tlayer.addEventListener('mousedown', this.onMouse, true);\n\
\t\tlayer.addEventListener('mouseup', this.onMouse, true);\n\
\t}\n\
\n\
\tlayer.addEventListener('click', this.onClick, true);\n\
\tlayer.addEventListener('touchstart', this.onTouchStart, false);\n\
\tlayer.addEventListener('touchmove', this.onTouchMove, false);\n\
\tlayer.addEventListener('touchend', this.onTouchEnd, false);\n\
\tlayer.addEventListener('touchcancel', this.onTouchCancel, false);\n\
\n\
\t// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)\n\
\t// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick\n\
\t// layer when they are cancelled.\n\
\tif (!Event.prototype.stopImmediatePropagation) {\n\
\t\tlayer.removeEventListener = function(type, callback, capture) {\n\
\t\t\tvar rmv = Node.prototype.removeEventListener;\n\
\t\t\tif (type === 'click') {\n\
\t\t\t\trmv.call(layer, type, callback.hijacked || callback, capture);\n\
\t\t\t} else {\n\
\t\t\t\trmv.call(layer, type, callback, capture);\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tlayer.addEventListener = function(type, callback, capture) {\n\
\t\t\tvar adv = Node.prototype.addEventListener;\n\
\t\t\tif (type === 'click') {\n\
\t\t\t\tadv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {\n\
\t\t\t\t\tif (!event.propagationStopped) {\n\
\t\t\t\t\t\tcallback(event);\n\
\t\t\t\t\t}\n\
\t\t\t\t}), capture);\n\
\t\t\t} else {\n\
\t\t\t\tadv.call(layer, type, callback, capture);\n\
\t\t\t}\n\
\t\t};\n\
\t}\n\
\n\
\t// If a handler is already declared in the element's onclick attribute, it will be fired before\n\
\t// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and\n\
\t// adding it as listener.\n\
\tif (typeof layer.onclick === 'function') {\n\
\n\
\t\t// Android browser on at least 3.2 requires a new reference to the function in layer.onclick\n\
\t\t// - the old one won't work if passed to addEventListener directly.\n\
\t\toldOnClick = layer.onclick;\n\
\t\tlayer.addEventListener('click', function(event) {\n\
\t\t\toldOnClick(event);\n\
\t\t}, false);\n\
\t\tlayer.onclick = null;\n\
\t}\n\
}\n\
\n\
\n\
/**\n\
 * Android requires exceptions.\n\
 *\n\
 * @type boolean\n\
 */\n\
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;\n\
\n\
\n\
/**\n\
 * iOS requires exceptions.\n\
 *\n\
 * @type boolean\n\
 */\n\
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);\n\
\n\
\n\
/**\n\
 * iOS 4 requires an exception for select elements.\n\
 *\n\
 * @type boolean\n\
 */\n\
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\\d(_\\d)?/).test(navigator.userAgent);\n\
\n\
\n\
/**\n\
 * iOS 6.0(+?) requires the target element to be manually derived\n\
 *\n\
 * @type boolean\n\
 */\n\
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\\d{2})_\\d/).test(navigator.userAgent);\n\
\n\
\n\
/**\n\
 * Determine whether a given element requires a native click.\n\
 *\n\
 * @param {EventTarget|Element} target Target DOM element\n\
 * @returns {boolean} Returns true if the element needs a native click\n\
 */\n\
FastClick.prototype.needsClick = function(target) {\n\
\t'use strict';\n\
\tswitch (target.nodeName.toLowerCase()) {\n\
\n\
\t// Don't send a synthetic click to disabled inputs (issue #62)\n\
\tcase 'button':\n\
\tcase 'select':\n\
\tcase 'textarea':\n\
\t\tif (target.disabled) {\n\
\t\t\treturn true;\n\
\t\t}\n\
\n\
\t\tbreak;\n\
\tcase 'input':\n\
\n\
\t\t// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)\n\
\t\tif ((this.deviceIsIOS && target.type === 'file') || target.disabled) {\n\
\t\t\treturn true;\n\
\t\t}\n\
\n\
\t\tbreak;\n\
\tcase 'label':\n\
\tcase 'video':\n\
\t\treturn true;\n\
\t}\n\
\n\
\treturn (/\\bneedsclick\\b/).test(target.className);\n\
};\n\
\n\
\n\
/**\n\
 * Determine whether a given element requires a call to focus to simulate click into element.\n\
 *\n\
 * @param {EventTarget|Element} target Target DOM element\n\
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.\n\
 */\n\
FastClick.prototype.needsFocus = function(target) {\n\
\t'use strict';\n\
\tswitch (target.nodeName.toLowerCase()) {\n\
\tcase 'textarea':\n\
\t\treturn true;\n\
\tcase 'select':\n\
\t\treturn !this.deviceIsAndroid;\n\
\tcase 'input':\n\
\t\tswitch (target.type) {\n\
\t\tcase 'button':\n\
\t\tcase 'checkbox':\n\
\t\tcase 'file':\n\
\t\tcase 'image':\n\
\t\tcase 'radio':\n\
\t\tcase 'submit':\n\
\t\t\treturn false;\n\
\t\t}\n\
\n\
\t\t// No point in attempting to focus disabled inputs\n\
\t\treturn !target.disabled && !target.readOnly;\n\
\tdefault:\n\
\t\treturn (/\\bneedsfocus\\b/).test(target.className);\n\
\t}\n\
};\n\
\n\
\n\
/**\n\
 * Send a click event to the specified element.\n\
 *\n\
 * @param {EventTarget|Element} targetElement\n\
 * @param {Event} event\n\
 */\n\
FastClick.prototype.sendClick = function(targetElement, event) {\n\
\t'use strict';\n\
\tvar clickEvent, touch;\n\
\n\
\t// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)\n\
\tif (document.activeElement && document.activeElement !== targetElement) {\n\
\t\tdocument.activeElement.blur();\n\
\t}\n\
\n\
\ttouch = event.changedTouches[0];\n\
\n\
\t// Synthesise a click event, with an extra attribute so it can be tracked\n\
\tclickEvent = document.createEvent('MouseEvents');\n\
\tclickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);\n\
\tclickEvent.forwardedTouchEvent = true;\n\
\ttargetElement.dispatchEvent(clickEvent);\n\
};\n\
\n\
FastClick.prototype.determineEventType = function(targetElement) {\n\
\t'use strict';\n\
\n\
\t//Issue #159: Android Chrome Select Box does not open with a synthetic click event\n\
\tif (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {\n\
\t\treturn 'mousedown';\n\
\t}\n\
\n\
\treturn 'click';\n\
};\n\
\n\
\n\
/**\n\
 * @param {EventTarget|Element} targetElement\n\
 */\n\
FastClick.prototype.focus = function(targetElement) {\n\
\t'use strict';\n\
\tvar length;\n\
\n\
\t// Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.\n\
\tif (this.deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {\n\
\t\tlength = targetElement.value.length;\n\
\t\ttargetElement.setSelectionRange(length, length);\n\
\t} else {\n\
\t\ttargetElement.focus();\n\
\t}\n\
};\n\
\n\
\n\
/**\n\
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.\n\
 *\n\
 * @param {EventTarget|Element} targetElement\n\
 */\n\
FastClick.prototype.updateScrollParent = function(targetElement) {\n\
\t'use strict';\n\
\tvar scrollParent, parentElement;\n\
\n\
\tscrollParent = targetElement.fastClickScrollParent;\n\
\n\
\t// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the\n\
\t// target element was moved to another parent.\n\
\tif (!scrollParent || !scrollParent.contains(targetElement)) {\n\
\t\tparentElement = targetElement;\n\
\t\tdo {\n\
\t\t\tif (parentElement.scrollHeight > parentElement.offsetHeight) {\n\
\t\t\t\tscrollParent = parentElement;\n\
\t\t\t\ttargetElement.fastClickScrollParent = parentElement;\n\
\t\t\t\tbreak;\n\
\t\t\t}\n\
\n\
\t\t\tparentElement = parentElement.parentElement;\n\
\t\t} while (parentElement);\n\
\t}\n\
\n\
\t// Always update the scroll top tracker if possible.\n\
\tif (scrollParent) {\n\
\t\tscrollParent.fastClickLastScrollTop = scrollParent.scrollTop;\n\
\t}\n\
};\n\
\n\
\n\
/**\n\
 * @param {EventTarget} targetElement\n\
 * @returns {Element|EventTarget}\n\
 */\n\
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {\n\
\t'use strict';\n\
\n\
\t// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.\n\
\tif (eventTarget.nodeType === Node.TEXT_NODE) {\n\
\t\treturn eventTarget.parentNode;\n\
\t}\n\
\n\
\treturn eventTarget;\n\
};\n\
\n\
\n\
/**\n\
 * On touch start, record the position and scroll offset.\n\
 *\n\
 * @param {Event} event\n\
 * @returns {boolean}\n\
 */\n\
FastClick.prototype.onTouchStart = function(event) {\n\
\t'use strict';\n\
\tvar targetElement, touch, selection;\n\
\n\
\t// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).\n\
\tif (event.targetTouches.length > 1) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\ttargetElement = this.getTargetElementFromEventTarget(event.target);\n\
\ttouch = event.targetTouches[0];\n\
\n\
\tif (this.deviceIsIOS) {\n\
\n\
\t\t// Only trusted events will deselect text on iOS (issue #49)\n\
\t\tselection = window.getSelection();\n\
\t\tif (selection.rangeCount && !selection.isCollapsed) {\n\
\t\t\treturn true;\n\
\t\t}\n\
\n\
\t\tif (!this.deviceIsIOS4) {\n\
\n\
\t\t\t// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):\n\
\t\t\t// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched\n\
\t\t\t// with the same identifier as the touch event that previously triggered the click that triggered the alert.\n\
\t\t\t// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an\n\
\t\t\t// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.\n\
\t\t\tif (touch.identifier === this.lastTouchIdentifier) {\n\
\t\t\t\tevent.preventDefault();\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\n\
\t\t\tthis.lastTouchIdentifier = touch.identifier;\n\
\n\
\t\t\t// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:\n\
\t\t\t// 1) the user does a fling scroll on the scrollable layer\n\
\t\t\t// 2) the user stops the fling scroll with another tap\n\
\t\t\t// then the event.target of the last 'touchend' event will be the element that was under the user's finger\n\
\t\t\t// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check\n\
\t\t\t// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).\n\
\t\t\tthis.updateScrollParent(targetElement);\n\
\t\t}\n\
\t}\n\
\n\
\tthis.trackingClick = true;\n\
\tthis.trackingClickStart = event.timeStamp;\n\
\tthis.targetElement = targetElement;\n\
\n\
\tthis.touchStartX = touch.pageX;\n\
\tthis.touchStartY = touch.pageY;\n\
\n\
\t// Prevent phantom clicks on fast double-tap (issue #36)\n\
\tif ((event.timeStamp - this.lastClickTime) < 200) {\n\
\t\tevent.preventDefault();\n\
\t}\n\
\n\
\treturn true;\n\
};\n\
\n\
\n\
/**\n\
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.\n\
 *\n\
 * @param {Event} event\n\
 * @returns {boolean}\n\
 */\n\
FastClick.prototype.touchHasMoved = function(event) {\n\
\t'use strict';\n\
\tvar touch = event.changedTouches[0], boundary = this.touchBoundary;\n\
\n\
\tif (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\treturn false;\n\
};\n\
\n\
\n\
/**\n\
 * Update the last position.\n\
 *\n\
 * @param {Event} event\n\
 * @returns {boolean}\n\
 */\n\
FastClick.prototype.onTouchMove = function(event) {\n\
\t'use strict';\n\
\tif (!this.trackingClick) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\t// If the touch has moved, cancel the click tracking\n\
\tif (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {\n\
\t\tthis.trackingClick = false;\n\
\t\tthis.targetElement = null;\n\
\t}\n\
\n\
\treturn true;\n\
};\n\
\n\
\n\
/**\n\
 * Attempt to find the labelled control for the given label element.\n\
 *\n\
 * @param {EventTarget|HTMLLabelElement} labelElement\n\
 * @returns {Element|null}\n\
 */\n\
FastClick.prototype.findControl = function(labelElement) {\n\
\t'use strict';\n\
\n\
\t// Fast path for newer browsers supporting the HTML5 control attribute\n\
\tif (labelElement.control !== undefined) {\n\
\t\treturn labelElement.control;\n\
\t}\n\
\n\
\t// All browsers under test that support touch events also support the HTML5 htmlFor attribute\n\
\tif (labelElement.htmlFor) {\n\
\t\treturn document.getElementById(labelElement.htmlFor);\n\
\t}\n\
\n\
\t// If no for attribute exists, attempt to retrieve the first labellable descendant element\n\
\t// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label\n\
\treturn labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');\n\
};\n\
\n\
\n\
/**\n\
 * On touch end, determine whether to send a click event at once.\n\
 *\n\
 * @param {Event} event\n\
 * @returns {boolean}\n\
 */\n\
FastClick.prototype.onTouchEnd = function(event) {\n\
\t'use strict';\n\
\tvar forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;\n\
\n\
\tif (!this.trackingClick) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\t// Prevent phantom clicks on fast double-tap (issue #36)\n\
\tif ((event.timeStamp - this.lastClickTime) < 200) {\n\
\t\tthis.cancelNextClick = true;\n\
\t\treturn true;\n\
\t}\n\
\n\
\t// Reset to prevent wrong click cancel on input (issue #156).\n\
\tthis.cancelNextClick = false;\n\
\n\
\tthis.lastClickTime = event.timeStamp;\n\
\n\
\ttrackingClickStart = this.trackingClickStart;\n\
\tthis.trackingClick = false;\n\
\tthis.trackingClickStart = 0;\n\
\n\
\t// On some iOS devices, the targetElement supplied with the event is invalid if the layer\n\
\t// is performing a transition or scroll, and has to be re-detected manually. Note that\n\
\t// for this to function correctly, it must be called *after* the event target is checked!\n\
\t// See issue #57; also filed as rdar://13048589 .\n\
\tif (this.deviceIsIOSWithBadTarget) {\n\
\t\ttouch = event.changedTouches[0];\n\
\n\
\t\t// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null\n\
\t\ttargetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;\n\
\t\ttargetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;\n\
\t}\n\
\n\
\ttargetTagName = targetElement.tagName.toLowerCase();\n\
\tif (targetTagName === 'label') {\n\
\t\tforElement = this.findControl(targetElement);\n\
\t\tif (forElement) {\n\
\t\t\tthis.focus(targetElement);\n\
\t\t\tif (this.deviceIsAndroid) {\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\n\
\t\t\ttargetElement = forElement;\n\
\t\t}\n\
\t} else if (this.needsFocus(targetElement)) {\n\
\n\
\t\t// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.\n\
\t\t// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).\n\
\t\tif ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {\n\
\t\t\tthis.targetElement = null;\n\
\t\t\treturn false;\n\
\t\t}\n\
\n\
\t\tthis.focus(targetElement);\n\
\n\
\t\t// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.\n\
\t\tif (!this.deviceIsIOS4 || targetTagName !== 'select') {\n\
\t\t\tthis.targetElement = null;\n\
\t\t\tevent.preventDefault();\n\
\t\t}\n\
\n\
\t\treturn false;\n\
\t}\n\
\n\
\tif (this.deviceIsIOS && !this.deviceIsIOS4) {\n\
\n\
\t\t// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled\n\
\t\t// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).\n\
\t\tscrollParent = targetElement.fastClickScrollParent;\n\
\t\tif (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {\n\
\t\t\treturn true;\n\
\t\t}\n\
\t}\n\
\n\
\t// Prevent the actual click from going though - unless the target node is marked as requiring\n\
\t// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.\n\
\tif (!this.needsClick(targetElement)) {\n\
\t\tevent.preventDefault();\n\
\t\tthis.sendClick(targetElement, event);\n\
\t}\n\
\n\
\treturn false;\n\
};\n\
\n\
\n\
/**\n\
 * On touch cancel, stop tracking the click.\n\
 *\n\
 * @returns {void}\n\
 */\n\
FastClick.prototype.onTouchCancel = function() {\n\
\t'use strict';\n\
\tthis.trackingClick = false;\n\
\tthis.targetElement = null;\n\
};\n\
\n\
\n\
/**\n\
 * Determine mouse events which should be permitted.\n\
 *\n\
 * @param {Event} event\n\
 * @returns {boolean}\n\
 */\n\
FastClick.prototype.onMouse = function(event) {\n\
\t'use strict';\n\
\n\
\t// If a target element was never set (because a touch event was never fired) allow the event\n\
\tif (!this.targetElement) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\tif (event.forwardedTouchEvent) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\t// Programmatically generated events targeting a specific element should be permitted\n\
\tif (!event.cancelable) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\t// Derive and check the target element to see whether the mouse event needs to be permitted;\n\
\t// unless explicitly enabled, prevent non-touch click events from triggering actions,\n\
\t// to prevent ghost/doubleclicks.\n\
\tif (!this.needsClick(this.targetElement) || this.cancelNextClick) {\n\
\n\
\t\t// Prevent any user-added listeners declared on FastClick element from being fired.\n\
\t\tif (event.stopImmediatePropagation) {\n\
\t\t\tevent.stopImmediatePropagation();\n\
\t\t} else {\n\
\n\
\t\t\t// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)\n\
\t\t\tevent.propagationStopped = true;\n\
\t\t}\n\
\n\
\t\t// Cancel the event\n\
\t\tevent.stopPropagation();\n\
\t\tevent.preventDefault();\n\
\n\
\t\treturn false;\n\
\t}\n\
\n\
\t// If the mouse event is permitted, return true for the action to go through.\n\
\treturn true;\n\
};\n\
\n\
\n\
/**\n\
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring\n\
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or\n\
 * an actual click which should be permitted.\n\
 *\n\
 * @param {Event} event\n\
 * @returns {boolean}\n\
 */\n\
FastClick.prototype.onClick = function(event) {\n\
\t'use strict';\n\
\tvar permitted;\n\
\n\
\t// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.\n\
\tif (this.trackingClick) {\n\
\t\tthis.targetElement = null;\n\
\t\tthis.trackingClick = false;\n\
\t\treturn true;\n\
\t}\n\
\n\
\t// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.\n\
\tif (event.target.type === 'submit' && event.detail === 0) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\tpermitted = this.onMouse(event);\n\
\n\
\t// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.\n\
\tif (!permitted) {\n\
\t\tthis.targetElement = null;\n\
\t}\n\
\n\
\t// If clicks are permitted, return true for the action to go through.\n\
\treturn permitted;\n\
};\n\
\n\
\n\
/**\n\
 * Remove all FastClick's event listeners.\n\
 *\n\
 * @returns {void}\n\
 */\n\
FastClick.prototype.destroy = function() {\n\
\t'use strict';\n\
\tvar layer = this.layer;\n\
\n\
\tif (this.deviceIsAndroid) {\n\
\t\tlayer.removeEventListener('mouseover', this.onMouse, true);\n\
\t\tlayer.removeEventListener('mousedown', this.onMouse, true);\n\
\t\tlayer.removeEventListener('mouseup', this.onMouse, true);\n\
\t}\n\
\n\
\tlayer.removeEventListener('click', this.onClick, true);\n\
\tlayer.removeEventListener('touchstart', this.onTouchStart, false);\n\
\tlayer.removeEventListener('touchmove', this.onTouchMove, false);\n\
\tlayer.removeEventListener('touchend', this.onTouchEnd, false);\n\
\tlayer.removeEventListener('touchcancel', this.onTouchCancel, false);\n\
};\n\
\n\
\n\
/**\n\
 * Check whether FastClick is needed.\n\
 *\n\
 * @param {Element} layer The layer to listen on\n\
 */\n\
FastClick.notNeeded = function(layer) {\n\
\t'use strict';\n\
\tvar metaViewport;\n\
\tvar chromeVersion;\n\
\n\
\t// Devices that don't support touch don't need FastClick\n\
\tif (typeof window.ontouchstart === 'undefined') {\n\
\t\treturn true;\n\
\t}\n\
\n\
\t// Chrome version - zero for other browsers\n\
\tchromeVersion = +(/Chrome\\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];\n\
\n\
\tif (chromeVersion) {\n\
\n\
\t\tif (FastClick.prototype.deviceIsAndroid) {\n\
\t\t\tmetaViewport = document.querySelector('meta[name=viewport]');\n\
\t\t\t\n\
\t\t\tif (metaViewport) {\n\
\t\t\t\t// Chrome on Android with user-scalable=\"no\" doesn't need FastClick (issue #89)\n\
\t\t\t\tif (metaViewport.content.indexOf('user-scalable=no') !== -1) {\n\
\t\t\t\t\treturn true;\n\
\t\t\t\t}\n\
\t\t\t\t// Chrome 32 and above with width=device-width or less don't need FastClick\n\
\t\t\t\tif (chromeVersion > 31 && window.innerWidth <= window.screen.width) {\n\
\t\t\t\t\treturn true;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t// Chrome desktop doesn't need FastClick (issue #15)\n\
\t\t} else {\n\
\t\t\treturn true;\n\
\t\t}\n\
\t}\n\
\n\
\t// IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)\n\
\tif (layer.style.msTouchAction === 'none') {\n\
\t\treturn true;\n\
\t}\n\
\n\
\treturn false;\n\
};\n\
\n\
\n\
/**\n\
 * Factory method for creating a FastClick object\n\
 *\n\
 * @param {Element} layer The layer to listen on\n\
 */\n\
FastClick.attach = function(layer) {\n\
\t'use strict';\n\
\treturn new FastClick(layer);\n\
};\n\
\n\
\n\
if (typeof define !== 'undefined' && define.amd) {\n\
\n\
\t// AMD. Register as an anonymous module.\n\
\tdefine(function() {\n\
\t\t'use strict';\n\
\t\treturn FastClick;\n\
\t});\n\
} else if (typeof module !== 'undefined' && module.exports) {\n\
\tmodule.exports = FastClick.attach;\n\
\tmodule.exports.FastClick = FastClick;\n\
} else {\n\
\twindow.FastClick = FastClick;\n\
}\n\
//@ sourceURL=ftlabs-fastclick/lib/fastclick.js"
));
require.register("toggles/index.js", Function("exports, require, module",
"/**\n\
 * module dependencies\n\
 */\n\
\n\
var emitter = require('emitter'),\n\
    Events  = require('event'),\n\
    delegate = require('delegate'),\n\
    prefix = require('prefix'),\n\
    query = require('query'),\n\
    translate = require('translate'),\n\
    transitionend = require('transitionend');\n\
\n\
// module globals\n\
\n\
var hasTouch = 'ontouchstart' in window,\n\
    transition = prefix('transition'),\n\
    evs;\n\
\n\
evs = {\n\
  start: hasTouch ? 'touchstart' : 'mousedown',\n\
  move: hasTouch ? 'touchmove' : 'mousemove',\n\
  end: hasTouch ? 'touchend' : 'mouseup'\n\
};\n\
\n\
/**\n\
 * helper function\n\
 * get event pageX\n\
 *\n\
 * @param  {Event}  e\n\
 * @return {Number} pageX or Y value\n\
 * @api private\n\
 */\n\
\n\
var pageX = function page(e){\n\
  return (hasTouch && e.touches.length && e.touches[0])\n\
    ? e.touches[0].pageX\n\
    : e.pageX;\n\
};\n\
\n\
// defaults\n\
var defaults = {\n\
  transitionSpeed: 0.3,\n\
  round: true,\n\
  easing: 'ease'\n\
};\n\
\n\
/**\n\
 * Initialize a new `Toggles`\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} opts\n\
 * @api public\n\
 */\n\
\n\
function Toggles(el, opts) {\n\
  this.el = el;\n\
  this.drag = {};\n\
  this.handle = query('.toggle-handle', el);\n\
  this.progress = query('.toggle-progress', el);\n\
  this.states = [].map.call(query.all('[data-state]', el), function (node) {\n\
    return node.dataset.state;\n\
  });\n\
\n\
  // set opts\n\
  if (!opts) {\n\
    this.opts = defaults;\n\
  } else {\n\
    this.opts = {};\n\
    for (var opt in defaults) {\n\
      this.opts[opt] = opts[opt] ? opts[opt] : defaults[opt];\n\
    }\n\
  }\n\
\n\
  // bind instance methods\n\
  this.clickState = this.clickState.bind(this);\n\
  this.resetAnimate = this.resetAnimate.bind(this);\n\
  this.dragStart = this.dragStart.bind(this);\n\
  this.dragMove = this.dragMove.bind(this);\n\
  this.dragEnd = this.dragEnd.bind(this);\n\
\n\
  // bind events\n\
  delegate.bind(el, '.toggle-states [data-state]', 'click',  this.clickState);\n\
  Events.bind(this.handle, evs.start, this.dragStart);\n\
  Events.bind(document.body, evs.move, this.dragMove);\n\
  Events.bind(document.body, evs.end,  this.dragEnd);\n\
\n\
  // init dimensions\n\
  this.init();\n\
\n\
  // set initial index\n\
  this.setState(this.el.dataset.state || this.states[0], {\n\
    move: true,\n\
    animate: false\n\
  });\n\
}\n\
\n\
/*!\n\
 * Expose Toggles\n\
 */\n\
\n\
module.exports = Toggles;\n\
\n\
\n\
/**\n\
 * Mixin emitter\n\
 */\n\
\n\
emitter(Toggles.prototype);\n\
\n\
/**\n\
 * init dimensions values\n\
 */\n\
\n\
Toggles.prototype.init = function() {\n\
  this.handleWidth = this.handle.offsetWidth;\n\
\n\
  //     (*)--------(*)--------(*)\n\
  // [ state 1 ][ state 2 ][ state 3 ]\n\
  this.stepLength = this.el.offsetWidth / this.states.length;\n\
  this.toggleWidth = this.el.offsetWidth - this.stepLength;\n\
  this.handle.style.left = (this.stepLength - this.handleWidth) / 2 + 'px';\n\
\n\
};\n\
\n\
/**\n\
 * destroy component\n\
 */\n\
\n\
Toggles.prototype.destroy = function() {\n\
  Events.unbind(this.handle, evs.start, this.dragStart);\n\
  Events.unbind(document.body, evs.move, this.dragMove);\n\
  Events.unbind(document.body, evs.end,  this.dragEnd);\n\
  delegate.unbind(this.el, '.toggle-states [data-state]', 'click',\n\
    this.clickState);\n\
\n\
  this.el = this.progress = this.handle = null;\n\
};\n\
\n\
/**\n\
 * handle click on state\n\
 */\n\
\n\
Toggles.prototype.clickState = function (e) {\n\
  console.log(e.currentTarget);\n\
  this.setState(e.delegateTarget.dataset.state, {move: true, animate: true});\n\
};\n\
\n\
/**\n\
 * start dragging toggle handle\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Toggles.prototype.dragStart = function(e) {\n\
\n\
  // save drag state\n\
  this.drag = {\n\
    index: this.index,\n\
    offset: this.x,\n\
    dragging: true,\n\
    pageX: pageX(e)\n\
  };\n\
};\n\
\n\
/**\n\
 * handle dragging toggle\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Toggles.prototype.dragMove = function(e) {\n\
  if (!this.drag.dragging) return;\n\
  if (hasTouch && e.touches.length && e.touches.length > 1) return;\n\
\n\
  e.preventDefault();\n\
\n\
  var distance = pageX(e) - this.drag.pageX + this.drag.offset,\n\
      newIndex = Math.round(distance / this.stepLength);\n\
\n\
  if (distance > this.toggleWidth) {\n\
    distance = this.toggleWidth;\n\
    newIndex = this.states.length - 1;\n\
  } else if (distance < 0) {\n\
    distance = 0;\n\
    newIndex = 0;\n\
  } else {\n\
    newIndex = Math.round(distance / this.stepLength);\n\
  }\n\
\n\
  this.move(distance);\n\
  this.setIndex(newIndex, {animate: false, move: false});\n\
};\n\
\n\
/**\n\
 * handle dragend\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Toggles.prototype.dragEnd = function(e) {\n\
  if (!this.drag.dragging) return;\n\
  e.preventDefault();\n\
\n\
  this.drag.dragging = false;\n\
  this.setIndex(this.index, {animate: true, move: true});\n\
  return false;\n\
};\n\
\n\
/**\n\
 * set state\n\
 * @param  {Object} opts\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Toggles.prototype.setState = function (state, opts) {\n\
  this.setIndex(this.states.indexOf(state), opts);\n\
};\n\
\n\
/**\n\
 * set index\n\
 * @param  {Object} opts\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Toggles.prototype.setIndex = function(index, opts) {\n\
  var update = this.index !== index;\n\
\n\
  if (update) {\n\
    this.index = index;\n\
    this.state = this.states[index];\n\
    this.el.dataset.state = this.state;\n\
    if (!opts.silent) this.emit('toggle', {state: this.state});\n\
  }\n\
\n\
  var _this = this,\n\
    animate = opts.animate && (this.x !== index * this.stepLength)\n\
    style = 'all ' + this.opts.transitionSpeed + 's ' + this.opts.easing;\n\
\n\
  if (animate) {\n\
    if (this.progress) this.progress.style[transition] = style;\n\
    if (this.handle) this.handle.style[transition] = style;\n\
    Events.bind(this.handle, transitionend, this.resetAnimate);\n\
  }\n\
\n\
  if (opts.move) this.moveToIndex(index);\n\
};\n\
\n\
\n\
/**\n\
 * reset animation\n\
 * @private\n\
 */\n\
\n\
Toggles.prototype.resetAnimate = function () {\n\
  Events.unbind(this.handle, transitionend, this.resetAnimate);\n\
  if (this.handle) this.handle.style[transition] = '';\n\
  if (this.progress) this.progress.style[transition] = '';\n\
};\n\
\n\
\n\
/**\n\
 * move handle to index\n\
 *\n\
 * @param {Number} index\n\
 * @return {Boolean} true if x position has changed\n\
 * @api private\n\
 */\n\
\n\
Toggles.prototype.moveToIndex = function(index) {\n\
  this.move(index * this.stepLength);\n\
};\n\
\n\
/**\n\
 * move handle and progress\n\
 * @param {Number} x\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Toggles.prototype.move = function(x) {\n\
  if (this.x === x) return;\n\
  this.x = x;\n\
  if (this.progress) translate(this.progress, x, 0, 0);\n\
  if (this.handle) translate(this.handle, x, 0, 0);\n\
};\n\
\n\
\n\
//@ sourceURL=toggles/index.js"
));


















require.alias("component-emitter/index.js", "toggles/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("component-event/index.js", "toggles/deps/event/index.js");
require.alias("component-event/index.js", "event/index.js");

require.alias("component-delegate/index.js", "toggles/deps/delegate/index.js");
require.alias("component-delegate/index.js", "delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-query/index.js", "toggles/deps/query/index.js");
require.alias("component-query/index.js", "query/index.js");

require.alias("component-translate/index.js", "toggles/deps/translate/index.js");
require.alias("component-translate/index.js", "toggles/deps/translate/index.js");
require.alias("component-translate/index.js", "translate/index.js");
require.alias("component-has-translate3d/index.js", "component-translate/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-transform-property/index.js", "component-translate/deps/transform-property/index.js");

require.alias("component-translate/index.js", "component-translate/index.js");
require.alias("pgherveou-prefix/index.js", "toggles/deps/prefix/index.js");
require.alias("pgherveou-prefix/index.js", "toggles/deps/prefix/index.js");
require.alias("pgherveou-prefix/index.js", "prefix/index.js");
require.alias("pgherveou-prefix/index.js", "pgherveou-prefix/index.js");
require.alias("pgherveou-transitionend/index.js", "toggles/deps/transitionend/index.js");
require.alias("pgherveou-transitionend/index.js", "toggles/deps/transitionend/index.js");
require.alias("pgherveou-transitionend/index.js", "transitionend/index.js");
require.alias("pgherveou-prefix/index.js", "pgherveou-transitionend/deps/prefix/index.js");
require.alias("pgherveou-prefix/index.js", "pgherveou-transitionend/deps/prefix/index.js");
require.alias("pgherveou-prefix/index.js", "pgherveou-prefix/index.js");
require.alias("pgherveou-transitionend/index.js", "pgherveou-transitionend/index.js");
require.alias("ftlabs-fastclick/lib/fastclick.js", "toggles/deps/fastclick/lib/fastclick.js");
require.alias("ftlabs-fastclick/lib/fastclick.js", "toggles/deps/fastclick/index.js");
require.alias("ftlabs-fastclick/lib/fastclick.js", "fastclick/index.js");
require.alias("ftlabs-fastclick/lib/fastclick.js", "ftlabs-fastclick/index.js");
require.alias("toggles/index.js", "toggles/index.js");