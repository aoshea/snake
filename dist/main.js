(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./game');
},{"./game":2}],2:[function(require,module,exports){
require('./utils')
require('./render');
// snake game
(function (root) {
  
  // short hand 
  var req = root.utils.requestAnimationFrame,
      proxy = root.utils.proxy;
      
  // game configuration 
  var config = {
    grid: 16, //Math.floor(root.innerHeight / 30),
    speed: 6 
  };
  
  var constants = {
    LEFT: 1,
    UP: 2,
    RIGHT: 3,
    DOWN: 4
  };

  var Cell = {
    x: 0,
    y: 0,
    w: config.grid,
    h: config.grid
  };
  
  function createCell() {
    var cell = Object.create(Cell);
    cell.x = Math.floor(Math.random() * 30) * 30;
    cell.y = Math.floor(Math.random() * 30) * 30;
    return cell;
  }
  function createCells() {
    var len = 100, a = [];
    while(len--) {
      a.push(createCell());
    }
    return a;
  }

  var Actor = {
    cells: [],
    colour: "0xffffff"
  };
  
  var accel = {
    x: 1,
    y: 0
  };
  
  var touch = {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0
  };
  
  var direction;

  var Game = {
    frame: 0,
    init: function (render, output) {
      this.score = 0;
      this.output = output;
      this.dir = constants.DOWN;
      this.render = render;
      this.render.init();
      // create a snake.
      this.snake = Object.create(Actor);
      this.snake.position = {x:5, y:5};
      this.snake.tail = Object.create(Cell);
      this.snake.tail.x = this.snake.position.x;
      this.snake.tail.y = this.snake.position.y
      // create snake body 
      var i = 1;
      var temp = this.snake.tail;
      while(i--) {
        temp.prev = Object.create(Cell);
        temp.prev.x = 0;
        temp.prev.y = 0;
        temp = temp.prev;
      }
      // create food
      this.food = [];
      this.addFood();
      // create walls 
      this.wall = Object.create(Actor);
      // add listeners 
      this.addEventListeners();
      this.addScore(0);
      this.tick();
    },
    
    reset: function () {
      this.score = 0;
      this.addScore(0);
      this.snake.tail = Object.create(Cell);
      this.snake.tail.x = this.snake.position.x;
      this.snake.tail.y = this.snake.position.y
      // create snake body 
      var i = 1;
      var temp = this.snake.tail;
      while(i--) {
        temp.prev = Object.create(Cell);
        temp.prev.x = 0;
        temp.prev.y = 0;
        temp = temp.prev;
      }
      
      this.dead = false;
    },
    
    addEventListeners: function () {
      var self = this;
      root.addEventListener('touchstart', function (event) {
        event.preventDefault();
        if (self.dead) {
          self.reset();
          return;
        }
        touch.x0 = event.touches[0].clientX;
        touch.y0 = event.touches[0].clientY;
      });
      root.addEventListener('touchmove', function (event) {
        event.preventDefault();
        touch.x1 = event.touches[0].clientX;
        touch.y1 = event.touches[0].clientY;
        var dx = touch.x0 - touch.x1;
        var dy = touch.y0 - touch.y1;
        if (Math.abs(dx) > Math.abs(dy)) {
          // horizontal
          if (dx > 0) {
            //left
            if (direction !== constants.RIGHT) {
              self.dir = constants.LEFT;
            }
          } else {
            //right
            if (direction !== constants.LEFT) {
              self.dir = constants.RIGHT;
            }
          }
        } else {
          if (dy > 0) {
            // up
            if (direction !== constants.DOWN) {
              self.dir = constants.UP;
            }
          } else {
            // down 
            if (direction !== constants.UP) {
              self.dir = constants.DOWN;
            }
          }
        } 
      });
      root.addEventListener('keydown', function (event) {
        if (self.dead) {          
          self.reset();
          return;
        }
        switch(event.keyCode) {
          case 37:
            if (direction !== constants.RIGHT) {
              self.dir = constants.LEFT;
            }
            break;
          case 38:
            if (direction !== constants.DOWN) {
              self.dir = constants.UP;
            }
            break;
          case 39: 
            if (direction !== constants.LEFT) {
              self.dir = constants.RIGHT;
            }
            break;
          case 40:
            if (direction !== constants.UP) {
              self.dir = constants.DOWN;
            }
            break;          
        }
        event.preventDefault();
      });
    },
    
    getSnakeCells: function () {
      var temp = this.snake.tail,
          cells = [];
          
      while(temp) {
        cells.push(temp);        
        temp = temp.prev;
      }
      
      return cells;
    },
    getRandomCell: function () {
      return {
        x: Math.floor((Math.random() * root.innerWidth)/config.grid)*config.grid,
        y: Math.floor((Math.random() * root.innerHeight)/config.grid)*config.grid,
        w: config.grid,
        h: config.grid
      };
    },
    addScore: function (val) {
      this.score += val;
      this.output.textContent = this.score;
    },
    addFood: function () {
      
      var self = this;
      
      function randomFoodCell() {
        var cell = self.getRandomCell();
        var temp = self.snake.tail;
        while(temp) {
          if (temp.x === cell.x && temp.y === cell.y) {
            return randomFoodCell();
          }
          temp = temp.prev;
        }
        return cell;
      }
      
      var c = randomFoodCell();
            
      this.food.push(c);
    },
    collide: function () {
      // check with snake 
      var temp = this.snake.tail.prev; 
      while(temp) {
        
        if (temp.x === this.snake.tail.x && 
            temp.y === this.snake.tail.y) {
        
              // collision, end. 
              this.dead = true;
              return;
        }
        
        temp = temp.prev;
      }
      // check with food 
      // get head 
      temp = this.snake.tail;
      var head;
      while(temp) {
        if (!temp.prev) {
          head = temp; 
        }  
        temp = temp.prev;                
      }
      var i = this.food.length;
      while(i--) {
        
        if (this.food[i].x === head.x && this.food[i].y === head.y) {
          var item = this.food.splice(i, 1);
          
          // duplicate tail
          item = Object.create(Cell);
          item.x = this.snake.tail.x;
          item.y = this.snake.tail.y;
          item.prev = this.snake.tail;          
          
          this.snake.tail = item;
          
          this.addFood();
          this.addScore(100);
        }
      }
    },
    tick: function () {
      req(proxy(this.tick, this));
      this.update();
      this.draw();
    },
    update: function () {
      if (this.dir !== null) {
        switch(this.dir) {
          case constants.LEFT:            
            accel.x = -1;
            accel.y = 0;        
          break;
          case constants.RIGHT:          
            accel.x = 1;
            accel.y = 0;            
          break;
          case constants.UP:
            accel.x = 0;
            accel.y = -1;
          break;
          case constants.DOWN:
            accel.x = 0;
            accel.y = 1;
          break;
        }
        direction = this.dir; 
        this.dir = null;
      }
      
    
      if (this.dead) {
        return;
      }
 
      if ((++this.frame % config.speed) === 0) {
        
        this.collide();
        
        var temp = this.snake.tail;
        
        while(temp) {
          
          if (temp.prev) {
            temp.x = temp.prev.x;
            temp.y = temp.prev.y;
          } else {
            
            var m = config.grid;
            
            temp.x += accel.x * m;
            temp.y += accel.y * m;
            
            var right = Math.floor(window.innerWidth/m)*m;
            var bottom = Math.floor(window.innerHeight/m)*m;
            
            if (temp.x > right) temp.x = 0;
            if (temp.y > bottom) temp.y = 0;
            if (temp.x < 0) temp.x = right;
            if (temp.y < 0) temp.y = bottom;
          }
          temp = temp.prev;
        }
        
      }
       
    },
    draw: function () {
      this.render.clear();
      // buffer snake cells 
      this.render.drawRects(this.getSnakeCells(), this.snake.colour);
      // buffer food 
      this.render.drawRects(this.food, this.food.colour);
      // buffer wall cells 
      this.render.drawRects(this.wall.cells, this.wall.colour);
      // draw to screen
      this.render.flush();
    }
  };

  var snakeGame = Object.create(Game);
  snakeGame.init(root.render, root.document.getElementsByClassName('content')[0]);
  snakeGame.draw();
  
})(window);

},{"./render":3,"./utils":4}],3:[function(require,module,exports){
/*jshint browser:true, devel:true */
/*global Float32Array */
(function (root) {
  
  "use strict"; 
  var document = root.document;
  
  root.render = (function () {
    
    var gl, 
        shaderProgram, 
        canvasWidth, 
        canvasHeight, 
        vertices, 
        lineVertices,
        colours, 
        vertexBuffer, 
        colourBuffer, 
        vertexPosAttrib, 
        vertexColourAttrib;
    
    function createShader(gl, shaderScript, src) {
      var shader;
      if (shaderScript.type === 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type === 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        return null;
      }
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Error compiling shaders ' + gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    }
    
    function getShader(gl, id) {
      var shaderScript, src, currentChild;      
      shaderScript = document.getElementById(id);
      if (!shaderScript) return null;
      
      src = '';
      currentChild = shaderScript.firstChild;
      while(currentChild) {
        if (currentChild.nodeType === currentChild.TEXT_NODE) {
          src += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
      }
      
      return createShader(gl, shaderScript, src);
    }
    
    function initShaders(gl, fragmentId, vertexId) {
      var fragmentShader = getShader(gl, fragmentId),
          vertexShader   = getShader(gl, vertexId);
          
      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, fragmentShader);
      gl.attachShader(shaderProgram, vertexShader);
      gl.linkProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw new Error('Unable to initialize shader program');
      }
      gl.useProgram(shaderProgram);    
    }
    
    function init() {

      var canvas = document.createElement('canvas');
      canvas.width = root.innerWidth;
      canvas.height = root.innerHeight;

      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
      
      gl = null;
  
      try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      } catch (e) {}
  
      if (!gl) {
        alert('Unable to initialise WebGL');
        return;
      }
        
      initShaders(gl, '2d-fragment-shader', '2d-vertex-shader');
      createBuffer();

      document.body.appendChild(canvas);
    }

    function setRect(x, y, width, height) {
      var x1 = x + width, y1 = y + height;
      vertices.push(x, y, x1, y, x, y1, x, y1, x1, y, x1, y1);
      
      var scale = y / gl.canvas.height;

      colours.push(
              1.0, 1-scale, scale, 1.0,
              1.0, 1-scale, scale, 1.0,
              1.0, 1-scale, scale, 1.0,
              1.0, 1-scale, scale, 1.0,              
              1.0, 1-scale, scale, 1.0,
              1.0, 1-scale, scale, 1.0                      
      );
    }
    
    function drawRects(rects, colour) {
      var i = rects.length;
      while(i--) {
        drawRect(rects[i].x, rects[i].y, rects[i].w, rects[i].h);
      }
    }
    
    function drawRect(x, y, width, height) {
      if (!vertices) vertices = [];            
      setRect(x, y, width, height);
    }
    
    function drawLine(x0, y0, x1, y1) {
      lineVertices.push(x0, y0, x1, y1);
    }
    
    function clear() {
      vertices = [];
      lineVertices = [];
      colours = [];
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    function flush() {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);  
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
      gl.vertexAttribPointer(vertexColourAttrib, 4, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);
      
      gl.drawArrays(gl.TRIANGLES, 0, parseInt(vertices.length/2, 10));   
      
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);  
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
      gl.vertexAttribPointer(vertexColourAttrib, 4, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);   
      
      gl.drawArrays(gl.LINES, 0, parseInt(lineVertices.length/2, 10));         
    }
    
    function createBuffer() {
      vertexColourAttrib = gl.getAttribLocation(shaderProgram, "a_colour");
      gl.enableVertexAttribArray(vertexColourAttrib);
      
      vertexPosAttrib = gl.getAttribLocation(shaderProgram, 'a_position');
      gl.enableVertexAttribArray(vertexPosAttrib);
  
      var resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
      gl.uniform2f(resolutionLocation, canvasWidth, canvasHeight);
  
      // create buffer
      vertexBuffer = gl.createBuffer();
      colourBuffer = gl.createBuffer();
      
      gl.enable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
    }
    
    return {
      init: init,
      clear: clear,
      flush: flush,
      drawRect: drawRect,
      drawRects: drawRects,
      drawLine: drawLine
    };    
  })();
  
})(window);

},{}],4:[function(require,module,exports){
/*jshint browser:true */

(function (root, factory) {

  "use strict";

  root.utils = factory(root);
                                            
})(window, function (window, undefined) {
  
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
  
});
},{}]},{},[1])