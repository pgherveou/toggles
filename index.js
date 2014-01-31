/**
 * module dependencies
 */

var emitter = require('emitter'),
    Events  = require('event'),
    delegate = require('delegate'),
    prefix = require('prefix'),
    query = require('query'),
    translate = require('translate'),
    transitionend = require('transitionend');

// module globals

var hasTouch = 'ontouchstart' in window,
    transition = prefix('transition'),
    evs;

evs = {
  start: hasTouch ? 'touchstart' : 'mousedown',
  move: hasTouch ? 'touchmove' : 'mousemove',
  end: hasTouch ? 'touchend' : 'mouseup'
};

/**
 * helper function
 * get event pageX
 *
 * @param  {Event}  e
 * @return {Number} pageX or Y value
 * @api private
 */

var pageX = function page(e){
  return (hasTouch && e.touches.length && e.touches[0])
    ? e.touches[0].pageX
    : e.pageX;
};

// defaults
var defaults = {
  transitionSpeed: 0.3,
  round: true,
  easing: 'ease'
};

/**
 * Initialize a new `Toggles`
 *
 * @param {Element} el
 * @param {Object} opts
 * @api public
 */

function Toggles(el, opts) {
  this.el = el;
  this.drag = {dragging: false, distance: 0};
  this.handle = query('.toggle-handle', el);
  this.progress = query('.toggle-progress', el);
  this.states = [].map.call(query.all('[data-state]', el), function (node) {
    return node.dataset.state;
  });

  // set opts
  if (!opts) {
    this.opts = defaults;
  } else {
    this.opts = {};
    for (var opt in defaults) {
      this.opts[opt] = opts[opt] ? opts[opt] : defaults[opt];
    }
  }

  // bind instance methods
  this.clickState = this.clickState.bind(this);
  this.resetAnimate = this.resetAnimate.bind(this);
  this.dragStart = this.dragStart.bind(this);
  this.dragMove = this.dragMove.bind(this);
  this.dragEnd = this.dragEnd.bind(this);

  // bind events
  delegate.bind(el, '.toggle-states [data-state]', 'click',  this.clickState);
  Events.bind(this.handle, evs.start, this.dragStart);
  Events.bind(document.body, evs.move, this.dragMove);
  Events.bind(document.body, evs.end,  this.dragEnd);

  // init dimensions
  this.init();

  // set initial index
  this.setState(this.el.dataset.state || this.states[0], {
    move: true,
    animate: false
  });
}

/*!
 * Expose Toggles
 */

module.exports = Toggles;


/**
 * Mixin emitter
 */

emitter(Toggles.prototype);

/**
 * init dimensions values
 */

Toggles.prototype.init = function() {
  this.handleWidth = this.handle.offsetWidth;

  //     (*)--------(*)--------(*)
  // [ state 1 ][ state 2 ][ state 3 ]
  this.stepLength = this.el.offsetWidth / this.states.length;
  this.toggleWidth = this.el.offsetWidth - this.stepLength;
  this.handle.style.left = (this.stepLength - this.handleWidth) / 2 + 'px';

};

/**
 * destroy component
 */

Toggles.prototype.destroy = function() {
  Events.unbind(this.handle, evs.start, this.dragStart);
  Events.unbind(document.body, evs.move, this.dragMove);
  Events.unbind(document.body, evs.end,  this.dragEnd);
  delegate.unbind(this.el, '.toggle-states [data-state]', 'click',
    this.clickState);

  this.el = this.progress = this.handle = null;
};

/**
 * handle click on state
 */

Toggles.prototype.clickState = function (e) {
  if(e.delegateTarget.dataset.disabled === 'true') return;
  this.setState(e.delegateTarget.dataset.state, {
    move: true,
    animate: true
  });
};

/**
 * start dragging toggle handle
 *
 * @api private
 */

Toggles.prototype.dragStart = function(e) {

  // save drag state
  this.drag = {
    offset: this.x,
    distance: 0,
    dragging: true,
    pageX: pageX(e)
  };
};

/**
 * handle dragging toggle
 *
 * @api private
 */

Toggles.prototype.dragMove = function(e) {
  if (!this.drag.dragging) return;
  if (hasTouch && e.touches.length && e.touches.length > 1) return;

  e.preventDefault();

  var distance = pageX(e) - this.drag.pageX + this.drag.offset,
      newIndex = Math.round(distance / this.stepLength);

  if (distance > this.toggleWidth) {
    distance = this.toggleWidth;
    newIndex = this.states.length - 1;
  } else if (distance < 0) {
    distance = 0;
    newIndex = 0;
  } else {
    newIndex = Math.round(distance / this.stepLength);
  }

  this.drag.distance = distance;
  this.move(distance);
  this.setIndex(newIndex, {animate: false, move: false});
};

/**
 * handle dragend
 *
 * @api private
 */

Toggles.prototype.dragEnd = function(e) {
  if (!this.drag.dragging) return;
  e.preventDefault();

  var distance = this.drag.distance,
      toggleState;

  // reset
  this.drag.dragging = false;
  this.drag.offset = 0;
  this.drag.distance = 0;

  // toggle state when user clicked on handler
  // and toggles has only two states

  if ((distance < 5) && this.states.length === 2 ) {

    // toggle
    toggleState = this.states[(1 + this.index) % 2];
    return this.setState(toggleState, {
      move: true,
      animate: true
    });
  }

  this.setIndex(this.index, {animate: true, move: true});
  return false;
};

/**
 * set state
 * @param  {Object} opts
 *
 * @api public
 */

Toggles.prototype.setState = function (state, opts) {
  this.setIndex(this.states.indexOf(state), opts || {
      animate: true,
      move: true
    });
};

/**
 * set index
 * @param  {Object} opts
 *
 * @api public
 */

Toggles.prototype.setIndex = function(index, opts) {
  var update = this.index !== index;

  if (update) {
    this.index = index;
    this.state = this.states[index];
    this.el.dataset.state = this.state;
    if (!opts.silent) this.emit('toggle', {state: this.state});
  }

  var animate = opts.animate && (this.x !== index * this.stepLength),
      style = 'all ' + this.opts.transitionSpeed + 's ' + this.opts.easing;

  if (animate) {
    if (this.progress) this.progress.style[transition] = style;
    if (this.handle) this.handle.style[transition] = style;
    Events.bind(this.handle, transitionend, this.resetAnimate);
  }

  if (opts.move) this.moveToIndex(index);
};


/**
 * reset animation
 * @private
 */

Toggles.prototype.resetAnimate = function () {
  Events.unbind(this.handle, transitionend, this.resetAnimate);
  if (this.handle) this.handle.style[transition] = '';
  if (this.progress) this.progress.style[transition] = '';
};


/**
 * move handle to index
 *
 * @param {Number} index
 * @return {Boolean} true if x position has changed
 * @api private
 */

Toggles.prototype.moveToIndex = function(index) {
  this.move(index * this.stepLength);
};

/**
 * move handle and progress
 * @param {Number} x
 *
 * @api private
 */

Toggles.prototype.move = function(x) {
  if (this.x === x) return;
  this.x = x;
  if (this.progress) translate(this.progress, x, 0, 0);
  if (this.handle) translate(this.handle, x, 0, 0);
};


