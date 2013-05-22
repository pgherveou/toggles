/**
 * module dependencies
 */

var bind  = require('bind')
  , classes = require('classes')
  , Emitter = require('emitter')
  , Events  = require('event')
  , map = require('map')
  , prefix = require('prefix')
  , prevent = require('prevent')
  , query = require('query')
  , translate = require('translate')
  , transitionend = require('transitionend');

// module globals

var hasTouch = 'ontouchstart' in window
  , transition = prefix('transition')
  , transform = prefix('transform')
  , evs = {
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
  return (hasTouch && e.touches.length && e.touches[0]) ? e.touches[0].pageX : e.pageX;
};

/**
 * Expose Toggles
 */

module.exports = Toggles;

/**
 * Static template generator
 * TODO make it a plain string template
 */

Toggles.template = function(locals) {
  return require('./template')(locals);
};

/**
 * Initialize a new `Toggles`
 *
 * @param {Element} el
 * @param {Object} opts
 * @api public
 */

function Toggles(el) {
  var self = this;
  this.el = el;
  this.$el = classes(el);
  this.handle = query('.toggle-handle', el);
  this.stateNodes = query.all('[data-state]', el);
  this.progress = query('.toggle-progress', el);

  // hard coded options TODO change this
  this.opts = {
    transitionSpeed: 0.3,
    easing: 'ease'
  };

  // bind methods to instances
  this.dragStart = bind(this, this.dragStart);
  this.dragMove = bind(this, this.dragMove);
  this.dragEnd = bind(this, this.dragEnd);

  this.states = map(this.stateNodes, function(el, i) {
    Events.bind(el, 'click', function() {
      self.init();
      self.easeTo(i);
    });
    return el.dataset.state;
  });

  // bind events
  Events.bind(this.handle, evs.start, this.dragStart);
  Events.bind(document.body, evs.move, this.dragMove);
  Events.bind(document.body, evs.end,  this.dragEnd);

  this.init();
  this.setState(this.el.dataset.state);
}

/**
 * Mixin emitter
 */

Emitter(Toggles.prototype);

/**
 * init dimensions values
 */

Toggles.prototype.init = function() {
  this.toggleWidth = this.el.offsetWidth;
  this.handleWidth = this.handle.offsetWidth - 2;
  this.max = this.toggleWidth - this.handleWidth;
  this.stepLength = this.toggleWidth / (this.states.length - 1);
};

/**
 * destroy component
 */

Toggles.prototype.destroy = function() {
  map(this.stateNodes, function(el, i) {
    Events.off(el, 'click');
  });

  Events.off(this.handle, evs.start, this.dragStart);
  Events.off(document.body, evs.move, this.dragMove);
  Events.off(document.body, evs.end,  this.dragEnd);
};

/**
 * start dragging toggle handle
 *
 * @api private
 */

Toggles.prototype.dragStart = function(e) {
  var length = this.states.length
    , index = this.states.indexOf(this.el.dataset.state);

  this.init();
  this.isDragging = true;
  this.distanceX = 0;
  this.dragStartX = pageX(e);
  this.offset = index ? index/(length -1) * this.toggleWidth - this.handleWidth / 2 : 0;

  this.el.style[transition] = '';
  this.$el.add('toggles-dragging');
};

/**
 * handle dragging toggle
 *
 * @api private
 */

Toggles.prototype.dragMove = function(e) {
  if (!this.isDragging) return;
  e = e.originalEvent || e;
  if (hasTouch && e.touches.length && e.touches.length > 1) return; // Exit if a pinch

  prevent(e);
  this.distanceX = pageX(e) - this.dragStartX;
  var offsetDistance = this.distanceX + this.offset;

  if (offsetDistance < 0) {
    this.move(0);
  } else if (offsetDistance > this.max) {
    this.move(this.max);
  } else {
    this.move(offsetDistance);
  }

  var index = Math.ceil((this.states.length -1)* (offsetDistance + this.handleWidth / 2) / this.toggleWidth);
  this.update(index);
};

/**
 * handle dragend
 *
 * @api private
 */

Toggles.prototype.dragEnd = function(e) {
  if (!this.isDragging) return;
  this.isDragging = false;
  this.$el.remove('toggles-dragging');

  var length = this.states.length
    , offsetDistance = this.distanceX + this.offset
    , index;


  if (offsetDistance < this.stepLength / 2 - this.handleWidth / 2) {
    index = 0;
  } else if (offsetDistance > this.toggleWidth - this.stepLength / 2 - this.handleWidth / 2) {
    index = length - 1;
  } else {
    index = Math.ceil((offsetDistance + this.handleWidth / 2 - this.stepLength / 2) / this.stepLength);
  }

  this.easeTo(index);
};

/**
 * animate animation
 * @param  {Number} index
 *
 * @api private
 */

Toggles.prototype.easeTo = function(index) {
  var self = this
    , length = this.states.length
    , state = this.el.dataset.state
    , next;

  this.progress.style[transition] = 'all ' + this.opts.transitionSpeed + 's ' + this.opts.easing;
  this.handle.style[transition] = 'all ' + this.opts.transitionSpeed + 's ' + this.opts.easing;
  this.update(index);

  next = function() {
    var newState = self.states[index];
    self.progress.style[transition] = '';
    self.handle.style[transition] = '';
    self.$el.remove('toggles-animating');
    if (newState !== state) {
      self.el.dataset.state = newState;
      self.emit('toggle', {index: index, state: newState});
    }
  };

  if (this.moveToIndex(index)) {
    this.$el.add('toggles-animating');
    Events.once(this.handle, transitionend, next);
  } else
    next();
};

/**
 * move handle to index
 *
 * @api private
 */

Toggles.prototype.moveToIndex = function(index) {
  var length = this.states.length
    , x = Math.min(this.max, index ? index/(length -1) * this.toggleWidth - this.handleWidth/2 : 0);
  return this.move(x);
};

/**
 * move handle and progress
 *
 * @api private
 */

Toggles.prototype.move = function(x) {
  if (this.x === x) return false;
  translate(this.progress, (-this.toggleWidth + x + this.handleWidth/2), 0, 0);
  translate(this.handle, x, 0, 0);
  this.x = x;
  return true;
};

/**
 * set state
 *
 * @api public
 */

Toggles.prototype.setState = function(state) {
  var index = this.states.indexOf(state);
  this.moveToIndex(index);
  this.update(index);
};

/**
 * add an active class on currently active state nodes
 *
 * @api private
 */

Toggles.prototype.update = function(index) {
  Array.prototype.slice.call(this.stateNodes, 0, index).forEach(function(el) {
    classes(el).add('active');
  });
  Array.prototype.slice.call(this.stateNodes, index + 1).forEach(function(el) {
    classes(el).remove('active');
  });
};

/**
 * make toggles a zepto/jquery plugin
 *
 * @api public
 */

Toggles.plugin = function($) {
  $.fn.toggles = function() {
    this.each(function (el) {
      new Toggles(el);
    });
  };
};