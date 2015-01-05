module.exports = (function () {
  
  "use strict";
  
  /* Helper method for preserving scope */
  var proxy = function () {
    var args = Array.prototype.slice.call(arguments),
        fn = args.shift(),
        context = args.shift();
      
    return function () {
      fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
    };
  };
  
  /* Polyfill for requestAnimationFrame */
  var requestAnimationFrame = window.requestAnimationFrame || 
                              window.webkitRequestAnimationFrame || 
                              window.oRequestAnimationFrame || 
                              window.msRequestAnimationFrame || 
                              window.mozRequestAnimationFrame || 
                              function (callback) {
                                return window.setTimeout(callback, 1000/60);
                              };
                         
  return {
    proxy: proxy,
    requestAnimationFrame: requestAnimationFrame
  };
  
})();
  
