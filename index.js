/**
 * module dependencies
 */

var angle = require('angle')
  , bind  = require('bind')
  , classes = require('classes')
  , Emitter = require('emitter')
  , Events  = require('event')
  , prefix = require('prefix')
  , prevent = require('prevent')
  , query = require('query')
  , translate = require('translate');

// module globals

var hasTouch = 'ontouchstart' in window
  , transition = prefix('transition')
  , evs = {
    start: hasTouch ? 'touchstart' : 'mousedown',
    move: hasTouch ? 'touchmove' : 'mousemove',
    end: hasTouch ? 'touchend' : 'mouseup'
  };


/**
 * helper function
 * get event pageX or pageY position
 *
 * @param  {String} t type X or Y
 * @param  {Event}  e
 * @return {Number} pageX or Y value
 */

var page = function page(t, e){
  return (hasTouch && e.touches.length && e.touches[0]) ? e.touches[0]['page'+t] : e['page'+t];
};


/**
 * Expose Toggles
 */

module.exports = Toggles;

/**
 * Initialize a new `Toggles`
 *
 * @param {Element} el
 * @param {Object} opts
 * @api public
 */

function Toggles(el) {
  this.el = el;
  this.$el = classes(el);
  this.handle = query('.toggle-handle', el);

  // bind methods to instances
  this.startDrag = bind(this, this.startDrag);
  this.dragMove = bind(this, this.dragMove);
  this.dragEnd = bind(this, this.dragEnd);

  // bind events
  Events.bind(el, evs.start, this.startDrag);
  Events.bind(el, evs.move, this.dragMove);
  Events.bind(el, evs.end,  this.dragEnd);
}

/**
 * Mixin emitter
 */

Emitter(Toggles.prototype);

/**
 * start dragging toggle handle
 *
 * @api private
 */

Toggles.prototype.startDrag = function(e) {
  this.toggleWidth = this.el.offsetWidth;
  this.handleWidth = this.handle.offsetWidth;
  this.halfWay     = this.toggleWidth / 2 - this.handleWidth / 2;

  var offset = this.$el.has('active') ? this.toggleWidth - this.handleWidth : 0;
  this.startDragX = page('X', e) - offset;
  this.startDragY = page('Y', e);

  this.el.style[transition] = '';
  this.isDragging  = true;
  this.distanceX = 0;
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

  var pageX = page('X', e)
    , pageY = page('Y', e)
    , offset = this.toggleWidth - this.handleWidth
    , distanceY = pageY - this.startDragY;

  this.distanceX = pageX - this.startDragX;

  // return if angle > 45°
  if (Math.abs(this.distanceX) < Math.abs(distanceY)) return;
  prevent(e);

  if (this.distanceX < 0) return translate(this.handle, 0, 0);
  if (this.distanceX > offset) return translate(this.handle, offset, 0, 0);
  translate(this.handle, this.distanceX, 0);

  if (this.distanceX > this.halfWay) {
    this.$el.add('active');
  } else {
    this.$el.remove('active');
  }
};

/**
 * handle dragend
 *
 * @api private
 */

Toggles.prototype.dragEnd = function(e) {
  if (!this.isDragging) return;
  this.isDragging = false;

  var offset = this.toggleWidth - this.handleWidth,
      slideOn = (!this.distanceX && !this.$el.has('active')) // touch to toggle
             || this.$el.has('active') && (this.distanceX > this.halfWay); // > halfway

  if (slideOn) {
    translate(this.handle, offset, 0, 0);
    this.$el.add('active');
  } else {
    this.$el.remove('active');
    translate(this.handle, 0, 0, 0);
  }

  this.emit('toggle', {isActive: slideOn});
};

/**
 * pluginify
 */

Toggles.plugin = function($) {
  $.fn.toggles = function() {
    this.each(function (el) {
      new Toggles(el);
    });
  };
};