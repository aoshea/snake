(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  FRICTION: 0.9,
  MAX_PARTICLES: 100,
  LEFT: 1,
  UP: 2,
  RIGHT: 4,
  DOWN: 8,
  GRID_SIZE: 14,
  SPEED: 3
};
},{}],2:[function(require,module,exports){
require('./game');
},{"./game":3}],3:[function(require,module,exports){
var utils  = require('./utils'),
    config = require('./config'),
    render = require('./render'),
    sound = require('./sound'),
    root = window
    ;
    
/** 
 * Snake game with particle effects
 */ 

var notes = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

function supportsLocalStorage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function round( value, step ) {
  return Math.floor( value / step ) * step;
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var iterator = 0;

var Explosion = {
  
  init: function ( x, y, ox, oy ) {
        
    this.particle = Object.create( Particle );
    this.particle.init( ox, oy );
    this.particle.x = x;
    this.particle.y = y;

    this.random = Math.random();
    
    this.lifespan = 0;
    this.target = Math.floor( Math.random () * 75) + 25;  
    this.state = 1;
     
    this.maxLifespan = 100;
     
  },
  
  update: function () {
    
    this.particle.update(); 
    this.x = this.particle.x;
    this.y = this.particle.y;
    
    this.lifespan = Math.max( 0, this.lifespan + this.state );
    
    if ( this.lifespan === this.target && this.state > 0 ) {      
      this.state = -1;
    }
    
    this.dead = this.lifespan < 1;
    
  }
  
};

// Define particle 
var Particle = {        
  
  init: function (x, y) {
    
    this.x = this.ox = x || 0;
    this.y = this.oy = y || 0;
    
    this.ax = this.ay = 0;
  },
  
  randomize: function () {
    
    this.x = Math.random() * 100;
    this.y = Math.random() * 100;
  },
      
  update: function () {   
    
    var tempx = this.x,
        tempy = this.y;
        
    this.x += ( config.FRICTION * this.x ) - ( config.FRICTION * this.ox ) + this.ax;
    this.y += ( config.FRICTION * this.y ) - ( config.FRICTION * this.oy ) + this.ay;

    this.ox = tempx;
    this.oy = tempy;  
  },
  
  clone: function () {
    var p = Object.create(this);
    p.init(this.x, this.y);
    return p;
  }
  
};

var Constraint = {
  
  init: function ( a, b, rest ) {

    this.a = a;
    this.b = b;
    this.rest = rest;
    
  },
  
  update: function () {
        
    var dx, dy, len, diff;
    
    dx = this.b.x - this.a.x;
    dy = this.b.y - this.a.y;
    
    len = Math.sqrt( dx * dx + dy * dy );
    
    diff = ( len - this.rest ) / len;
    
    this.a.x += dx * 0.5 * diff;
    this.a.y += dy * 0.5 * diff;
    
    this.b.x -= dx * 0.5 * diff;
    this.b.y -= dy * 0.5 * diff;    
    
  }
  
}
  
// short hand 
var req = utils.requestAnimationFrame,
    proxy = utils.proxy;

var Cell = {    
  x: 0,
  y: 0,
  w: config.GRID_SIZE,
  h: config.GRID_SIZE
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

var direction = 0, lastDirection = 0;

var Game = {
  REST: 12,
  frame: 0,
  
  createParticles: function () {
    
    var i = config.MAX_PARTICLES, particle;
    
    while(i--) {
      
      particle = Object.create( Particle );
      particle.init();
      particle.randomize();
      
      this.particles.push( particle );
    }
  },    

  listToArray: function ( head ) {
    
    var result, temp;
    
    result = [];
    temp = head;
    
    while(temp) {
      
      result.push( temp );
      temp = temp.next;
    }
    
    return result;            
  
  },
  
  moveParticle: function ( x, y, ox, oy ) {
    
    var particle = this.particles[ iterator % this.particles.length ];
    
    setTimeout( function () {
          
      particle.ox = ox;
      particle.oy = oy;
      particle.x = x;
      particle.y = y;
      
    }, 100);
    
    
    iterator++;
  },
  
  createExplosionCircle: function( cx, cy, magnitude ) {
      
    var n, angle, rx, ry, ix, iy, initRadius, radius, innerRadius;
    
    radius = initRadius = magnitude * 10;
  
    n = 90 * magnitude;
    
    iterator = 0;
  
    while(n--) {
      
      radius = initRadius * 0.75 + initRadius * 0.25 * Math.random();
      innerRadius = initRadius * 0.75 - 10;
    
      angle = (n*(5-magnitude)) * Math.PI / 180;
    
      rx = cx + Math.sin( angle ) * radius;
      ry = cy + Math.cos( angle ) * radius;
    
      ix = cx + Math.sin( angle ) * innerRadius;
      iy = cy + Math.cos( angle ) * innerRadius;
    
      this.addExplosion( rx, ry, ix, iy );
      this.moveParticle( rx, ry, ix, iy );
    }
  },
  
  
  addExplosion: function ( x, y, ox, oy ) {
    
    var explosion, temp;
    
    explosion = Object.create( Explosion );
    explosion.init( x, y, ox, oy );
    
    if ( !this.explosion ) {
      
      this.explosion = explosion;
      
    } else {
      
      temp = this.explosion;
      
      while( temp ) {
        
        if ( !temp.next ) {
        
          explosion.prev = temp;
          temp.next = explosion;
          
          return; 
        }
        
        temp = temp.next;          
      }      
    }
  },

  updateExplosions: function () {
    
    var temp, dead, head;
    
    head = temp = this.explosion;
    
    while(temp) {
        
      // remove from linked list if dead.
      if ( temp.dead ) {
                
        dead = temp;
        temp = temp.next;
        
        if ( dead === head ) {
          // if dead is head of linked list, make head next in list
          head = temp;
          this.explosion = head; 
          
          if ( temp ) {
            temp.prev = null;
          }
          
        } else {
          // previous now to reference item after dead 
          dead.prev.next = temp;
          if ( temp ) {
            temp.prev = dead.prev;
          }
        }
        
        dead = null;
        
      } else {
        
        temp.update();
        temp = temp.next;
        
      }
    }
    
  },

  updateParticles: function () {
    
    var i = config.MAX_PARTICLES;
    
    while(i--) {      
      this.particles[i].update();            
    }    
  }, 
  
  constrainParticles: function () {
    
    var i = config.MAX_PARTICLES;
    
    while(i--) {      
      this.particles[i].constrain( {
        x0: 0,
        x1: gl.canvas.clientWidth,
        y0: 0,
        y1: gl.canvas.clientHeight
      });            
    }   
  },
  
  updateConstraints: function () {
    
    var i = this.constraints.length;
    
    while(i--) {
      this.constraints[i].update();
    }
  },
  
  createConstraints: function () {
    
    var self = this;
    
    for(var i = 0; i < 1000; ++i) {
      
      createConstraint( i, this.particles, this.constraints, 10 );
      createConstraint( i, this.particles, this.constraints, 10 );      
      createConstraint( i, this.particles, this.constraints, 10 );
      createConstraint( i, this.particles, this.constraints, 10 );
      
      this.pIndex++; 
    }
    
    function createConstraint( index, particles, constraints, rest ) {
      
      var a, b, constraint;            
            
      a = particles[ self.pIndex++ ];
      b = particles[ self.pIndex++ ];
      
      constraint = Object.create( Constraint );
      constraint.init( a, b, rest );
      
      constraints.push( constraint );                  
    }
  },
  
  addSnakeSegment: function () {
    
    var segment;
    
    segment = Object.create( Cell );
    segment.x = this.snake.tail.x;
    segment.y = this.snake.tail.y;
    segment.prev = this.snake.tail;
    
    this.snake.tail = segment;        
  },
  
  initScores: function () {
    
    this.score = 0;
    this.hiscore = 0;
    
    if ( supportsLocalStorage() ) {
      
      this.localStorage = localStorage;
    
      if (!this.localStorage.hiscore) {
        this.localStorage.hiscore = 0;
      }
      
      this.hiscore = this.localStorage.hiscore;
    }     
  },
  
  resetSnake: function () {
    this.snake.tail = Object.create(Cell);
    // create snake body 
    var i = 1;    
    while(i--) {
      this.addSnakeSegment();
    }
  },
  
  start: function () {
    
    this.tick();
    
    sound.playStart();
  },
  
  init: function ( output ) {
        
    this.initScores();

    this.pIndex = 0;
    this.particles = [];
    this.constraints = [];
    this.createParticles();
    
    this.scoreEl = output.getElementsByClassName('score')[0];
    this.hiscoreEl = output.getElementsByClassName('hiscore')[0];
    
    this.hiscoreEl.textContent = pad(this.hiscore, 6);
    
    // create a snake.
    this.snake = Object.create(Actor);
    this.resetSnake();    
    
    // create food
    this.food = [];
    this.addFood();
    // create walls 
    this.wall = Object.create(Actor);
    // add listeners 
    this.addEventListeners();
    this.addScore(0);
    
    // start game 
    this.start();
  },
  
  reset: function () {
    this.score = 0;
    this.addScore(0);
    this.pIndex = 0;
    
    // reset snake body 
    this.snake.tail = Object.create(Cell);
    var i = 1;
    var temp = this.snake.tail;
    while(i--) {
      temp.prev = Object.create(Cell);
      temp = temp.prev;
    }
    
    this.dead = false;
  },
  
  moveLeft: function () {
    if ( !(direction & config.LEFT) && !(lastDirection & config.RIGHT) ) {
      direction += config.LEFT;            
    }
  },
  
  moveRight: function () {
    if ( !(direction & config.RIGHT) && !(lastDirection & config.LEFT) ) {
      direction += config.RIGHT;            
    }
  },
  
  moveUp: function () {
    if ( !(direction & config.UP) && !(lastDirection & config.DOWN) ) {
      direction += config.UP;            
    }
  },
  
  moveDown: function () {
    if ( !(direction & config.DOWN) && !(lastDirection & config.UP) ) {
      direction += config.DOWN;      
    } 
  },
  
  handleTouchStart: function ( event ) {
    
    event.preventDefault();
    
    if ( this.dead ) {
      this.reset();
      return;
    }
    
    touch.x0 = event.touches[0].clientX;
    touch.y0 = event.touches[0].clientY;        
    
  },
  
  handleTouchMove: function ( event ) {
    
    var dx, dy;
    
    event.preventDefault(); 
    
    touch.x1 = event.touches[0].clientX;
    touch.y1 = event.touches[0].clientY;
    
    dx = touch.x0 - touch.x1;
    dy = touch.y0 - touch.y1;
    
    direction = 0;
    
    if ( Math.abs(dx) > Math.abs(dy) ) {
      if (dx > 0) {
        this.moveLeft();
      } else {
        this.moveRight();
      }
    } else {
      if (dy > 0) {        
        this.moveUp();        
      } else {
        this.moveDown();
      }
    }
    
  },
  
  handleKeyDown: function ( event ) {
    
    event.preventDefault();
    
    if (this.dead) {
      this.reset();
      return;
    }
    
    switch(event.keyCode) {
      case 37:                                  
        this.moveLeft();
        break;
      case 38:          
        this.moveUp();
        break;
      case 39:             
        this.moveRight();
        break;
      case 40:    
        this.moveDown();     
        break;          
    }  
  },
  
  handleKeyUp: function ( event ) {
    
    event.preventDefault();
    
    switch(event.keyCode) {
      case 37:       
        if (direction & config.LEFT) {
          direction -= config.LEFT;            
        }
        break;
      case 38:    
        if (direction & config.UP) {
          direction -= config.UP;            
        }
        break
      case 39:             
        if (direction & config.RIGHT) {
          direction -= config.RIGHT;            
        }
        break;
      case 40:           
        if (direction & config.DOWN) {
          direction -= config.DOWN;            
        }
        break;          
    }    
  },
  
  addEventListeners: function () {
    
    var self = this;
    
    root.addEventListener('touchstart', proxy(this.handleTouchStart, this));    
    root.addEventListener('touchmove', proxy(this.handleTouchMove, this));
      
    root.addEventListener('keydown', proxy(this.handleKeyDown, this));    
    root.addEventListener('keyup', proxy(this.handleKeyUp, this));
    
    root.document.addEventListener('keydown', function (event) { event.preventDefault(); });    
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
  getCell: function (x, y, lifespan) {
    return {
      x: x, 
      y: y, 
      w: config.GRID_SIZE, 
      h: config.GRID_SIZE, 
      lifespan:lifespan || 150
    };
  },
  getRandomCell: function () {
    
    var step = config.GRID_SIZE;
    
    return {
      x: round( Math.random() * (gl.canvas.clientWidth-step), step ),
      y: round( Math.random() * (gl.canvas.clientHeight-step), step ),
      w: step,
      h: step,
      lifespan: 250
    };
  },
  addScore: function (val) {
    
    this.score += val;
    this.scoreEl.textContent = pad(this.score, 6);
    
    if (this.score >= this.hiscore) {
      this.hiscoreEl.textContent = pad(this.score, 6);
      this.hiscore = this.score;
      this.localStorage.hiscore = this.hiscore;
    }
  },
  addFood: function (isFull) {
    
    var self = this;
    
    function checkCell( cell, tail ) {
      
      var a, b, c, d, step = config.GRID_SIZE;
      
      a = ( cell.x === tail.x && cell.y === tail.y );
      b = ( (cell.x + step) === tail.x && cell.y === tail.y );
      c = ( cell.x === tail.x && (cell.y + step) === tail.y );
      d = ( (cell.x + step) === tail.x && (cell.y + step) === tail.y );

      return a || b || c || d;      
    }
    
    function randomFoodCell() {
      var cell = self.getRandomCell();
      var temp = self.snake.tail;
      while(temp) {
        if (checkCell(cell, temp)) {
          return randomFoodCell();
        }
        temp = temp.prev;
      }
      return cell;
    }
    
    var c = randomFoodCell();
    
    var r = Math.random(); 
    
    var step = config.GRID_SIZE;
    
    if (r < 0.25) {
      this.food.push([
        c, 
        this.getCell(c.x+step, c.y), 
        this.getCell(c.x+step, c.y+step), 
        this.getCell(c.x, c.y+step)]);
    } else if (r < 0.5) {
      this.food.push([
        c, 
        this.getCell(c.x+step, c.y), 
        this.getCell(c.x+step, c.y+step)]);
    } else if ( r < 0.95) {
      this.food.push([
        c, 
        this.getCell(c.x+step, c.y)]);
    } else {
      this.food.push([c]);
    }
          
    this.food.push();
  },
  // get head of the snake linked list 
  getHead: function () {
    
    var temp = this.snake.tail,
        head;
        
    while(temp) {
      
      if (!temp.prev) {
        return temp;
      } 
      
      temp = temp.prev;        
    }
    
    return head;
  },
  collide: function () {
    
    // use head for collisions 
    var head = this.getHead(); 
         
    // check with snake 
    var temp = this.snake.tail;
    var n = 0;
              
    while(temp) {
      
      ++n;
              
      if (temp.prev) {

        if (head.x === temp.x && head.y === temp.y) {
          this.dead = true;
          return true;
        }          
      }
      
      temp = temp.prev;
    }
    
    
    // check with food 
    var j = this.food.length; 
    
    while(j--) {
      
      var food = this.food[j];
      var i = food.length;
      while(i--) {
      
        if (food[i].x === head.x && food[i].y === head.y) {
          
          // remove all of this food chunk
          this.food.splice(j, 1);
          
          // duplicate tail by len
          for(var m = 0; m < food.length; ++m) {
            var item;
            item = Object.create(Cell);
            item.x = this.snake.tail.x;
            item.y = this.snake.tail.y;
            item.prev = this.snake.tail;               
            this.snake.tail = item;  
          }                  
          
          sound.playPickup( notes[ food.length ] );
          
          this.addFood();
          this.addScore(100 * food.length);
          
          return food.length;
        }
      }
    }
    
    return 0;
  },
  tick: function () {
    req(proxy(this.tick, this));
    this.update();
    this.draw();
  },
  updateFood: function () {
    var j = this.food.length;
    while(j--) {
      var food = this.food[j];
      var i = food.length-1;
      food[i].lifespan--;
      if (!food[i].lifespan) {
        food.splice(i, 1);
        
        sound.playVanish( notes[ food.length+1 ] );
      }
      if (food.length === 0) {
        this.food.splice(j, 1);
        this.addFood();
      }
    }
  },
  update: function () {
    
    this.updateParticles();
    //his.updateConstraints();
    this.updateExplosions();
    
    if (this.dead) {
      return;
    }
    
    this.updateFood();

    if ((++this.frame % config.SPEED) === 0) {      
      
      if (direction & config.LEFT) {
        accel.x = -1;
        accel.y = 0;
      }
      if (direction & config.RIGHT) {
        accel.x = 1;
        accel.y = 0;
      }
      if (direction & config.UP) {
        accel.y = -1;      
        accel.x = 0;    
      }
      if (direction & config.DOWN) {
        accel.y = 1;
        accel.x = 0;
      }
            
      lastDirection = direction || lastDirection;
      
      var temp = this.snake.tail,
          head;
              
      while(temp) {
        
        if (temp.prev) {
          
          temp.x = temp.prev.x;
          temp.y = temp.prev.y;
          
        } else {
          
          var m = config.GRID_SIZE;
          
          head = temp;
          
          temp.x += accel.x * m;
          temp.y += accel.y * m;
          
          var right = round( gl.canvas.clientWidth, m );
          var bottom = round( gl.canvas.clientHeight, m );
          
          if (temp.x >= right) temp.x = 0;
          if (temp.y >= bottom) temp.y = 0;
          if (temp.x < 0) temp.x = right;
          if (temp.y < 0) temp.y = bottom;                  
        }
        
        temp = temp.prev;                  
      }
      
      var collisionSize = this.collide();
                  
      if ( collisionSize ) {                
        this.createExplosionCircle( head.x, head.y, collisionSize );        
      }              
    }     
  },
  draw: function () {
    
    // clear canvas 
    render.clear();
    
    // buffer snake cells 
    render.drawRects( this.getSnakeCells() );
    
    // buffer food 
    var i = this.food.length;    
    while(i--) {
      render.drawRects( this.food[i] );
    }
    
    // buffer particles ( rendered by current vector )
    render.drawParticles( this.particles );
    
    // buffer explosions
    render.drawExplosions( this.listToArray( this.explosion ) );
    
    // draw to canvas 
    render.drawScene();       
  }
};

// Init webgl and start up game once ready 
var gl = render.init( function () {
  
  var game = Object.create( Game );
  
  game.init( document.getElementsByClassName( 'ui' )[0] );
  
} );

},{"./config":1,"./render":4,"./sound":5,"./utils":6}],4:[function(require,module,exports){
var glUtils = require('./webgl-utils'),
    config  = require('./config')
    ;

/**
 * Game Renderer 
 */

var render = (function () {
  
  // Constants
  var MAX_VERTICES = 300;
  
  var time = 0;
  
  // WebGL context 
  var gl;
  
  // Shader programs
  var program, flipProgram;
  
  // Shaders 
  var shaders = {
    vertex: '',
    fragment: '',
    reverse_fragment: ''
  };
  
  // Shader properties 
  var positionLocation, matrixLocation, timeLocation;
  
  // Buffers
  var buffer, flipBuffer, particleBuffer, squareBuffer;
  
  // Points
  var points, numPoints; 
  
  // Particle vertices  
  var vertices;
  
  // Explosion data, x,y, random value
  var explosion, numExplosions;
  
  // Matrices
  var translation, rotation, scale;
  
  function setup() {
    
    program = glUtils.createProgram( shaders.vertex, shaders.fragment );
    flipProgram = glUtils.createProgram( shaders.vertex, shaders.reverse_fragment );
    
    // setup matrices
    translation = [100, 0, 0];
    points = [[0, 0]];
    numPoints = 1;
    rotation = [0, 0, 0];
    scale = [1, 1, 1];
    
    timeLocation = gl.getUniformLocation( flipProgram, 'u_time' );
    // loop up where the vertex data needs to go 
    positionLocation = gl.getAttribLocation( program, 'a_position' );
    // look up uniforms 
    matrixLocation = gl.getUniformLocation( program, 'u_matrix' );
    
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // left column
          0,   0,  0,
         config.GRID_SIZE,   0,  0,
          0, config.GRID_SIZE,  0]),
      gl.STATIC_DRAW);
      
    flipBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, flipBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // left column
        0,   config.GRID_SIZE,  0,
        config.GRID_SIZE,   0,  0,
        config.GRID_SIZE,  config.GRID_SIZE,  0]),
      gl.STATIC_DRAW);
      
    // Create square buffer
    squareBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, squareBuffer );
    gl.bufferData( 
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0, 0,
        config.GRID_SIZE, 0, 0,
        0, config.GRID_SIZE, 0,
        0, config.GRID_SIZE, 0,
        config.GRID_SIZE, 0, 0,
        config.GRID_SIZE, config.GRID_SIZE, 0
      ]),
      gl.STATIC_DRAW
    );
      
    // Create particle buffer 
    vertices = [];
    for(var i = 0; i < MAX_VERTICES; ++i) {
      vertices[i] = 0.0;
    }
    vertices = new Float32Array( vertices );
    
    particleBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, particleBuffer );
    gl.bufferData( 
      gl.ARRAY_BUFFER,
      vertices,
      gl.DYNAMIC_DRAW);
      
    // blending 
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.DST_COLOR);
      
    drawScene();  
  }
    
  function init( callback ) {
    
    gl = glUtils.setupGL( document.getElementById('canvas') ); 
    
    glUtils.loadShaders( shaders, function () {
      setup();
      callback(); 
    });
    
    return gl;
  }
  
  function drawScene() {    
    
    gl.useProgram( program );
    positionLocation = gl.getAttribLocation( program, 'a_position' );
    matrixLocation = gl.getUniformLocation( program, 'u_matrix' );
    gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    // Compute the matrices
    var matrix, projectionMatrix, scaleMatrix;
    
    var i, point;
    
    projectionMatrix = make2DProjection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
    scaleMatrix = makeScale(scale[0], scale[1], scale[2]);
    
    for(i = 0; i < numPoints; ++i) {
    
      point = points[i];
      
      translationMatrix = makeTranslation(point[0], point[1], 1);
      rotationXMatrix = makeXRotation(rotation[0]);
      rotationYMatrix = makeYRotation(rotation[1]);
      rotationZMatrix = makeZRotation(rotation[2]);
    
      matrix = makeIdentity();        
      
      matrix = matrixMultiply(scaleMatrix, rotationZMatrix);
      matrix = matrixMultiply(matrix, rotationYMatrix);
      matrix = matrixMultiply(matrix, rotationXMatrix);
      matrix = matrixMultiply(matrix, translationMatrix);
      matrix = matrixMultiply(matrix, projectionMatrix);
    
      // set the matrix 
      gl.uniformMatrix4fv(matrixLocation, false, matrix);
  
      // draw the geometry 
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }    
    
    gl.useProgram( flipProgram );
    positionLocation = gl.getAttribLocation( flipProgram, 'a_position' );
    matrixLocation = gl.getUniformLocation( flipProgram, 'u_matrix' );
    timeLocation = gl.getUniformLocation( flipProgram, 'u_time' );
    
    gl.uniform1f( timeLocation, performance.now() / 1000 );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, squareBuffer );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);   
    
    var expl;
        
    for(i = 0; i < numExplosions; ++i) {
      
      expl = explosions[i];    
            
      translationMatrix = makeTranslation( expl.translation[0], expl.translation[1], expl.translation[2] );
      rotationXMatrix = makeXRotation( expl.rotation[0] );
      rotationYMatrix = makeYRotation( expl.rotation[1] );
      rotationZMatrix = makeZRotation( expl.rotation[2] );
      scaleMatrix = makeScale( expl.scale, expl.scale, expl.scale ); 
      
      gl.uniform1f( timeLocation, i*0.1);
      
      var tempTranslationMatrix = makeTranslation( -4, -4, 0 );
      var tempInverseTranslationMatrix = makeTranslation( 4, 4,  0);
    
      matrix = makeIdentity();
      
      matrix = matrixMultiply(matrix, tempTranslationMatrix);
      
      matrix = matrixMultiply(matrix, scaleMatrix);
      
      matrix = matrixMultiply(matrix, tempInverseTranslationMatrix);
            
      matrix = matrixMultiply( matrix, rotationZMatrix );
      matrix = matrixMultiply( matrix, rotationYMatrix );
      matrix = matrixMultiply( matrix, rotationXMatrix );
      matrix = matrixMultiply( matrix, translationMatrix );
      matrix = matrixMultiply( matrix, projectionMatrix ); 
    
      // set the matrix 
      gl.uniformMatrix4fv(matrixLocation, false, matrix);
  
      // draw the geometry 
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
      
    scaleMatrix = makeScale( 1, 1, 1 ); 
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, flipBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);   
    
    for(i = 0; i < numPoints; ++i) {
    
      point = points[i];
        
      translationMatrix = makeTranslation(point[0], point[1], 1);
      rotationXMatrix = makeXRotation(rotation[0]);
      rotationYMatrix = makeYRotation(rotation[1]);
      rotationZMatrix = makeZRotation(rotation[2]);
    
      matrix = makeIdentity();        
      matrix = matrixMultiply(scaleMatrix, rotationZMatrix);
      matrix = matrixMultiply(matrix, rotationYMatrix);
      matrix = matrixMultiply(matrix, rotationXMatrix);
      matrix = matrixMultiply(matrix, translationMatrix);
      matrix = matrixMultiply(matrix, projectionMatrix);
    
      // set the matrix 
      gl.uniformMatrix4fv(matrixLocation, false, matrix);
  
      // draw the geometry 
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }       
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW); 
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    
    matrix = makeIdentity();        
    translationMatrix = makeTranslation(0, 0, 1);
    matrix = matrixMultiply(scaleMatrix, rotationZMatrix);
    matrix = matrixMultiply(matrix, rotationYMatrix);
    matrix = matrixMultiply(matrix, rotationXMatrix);
    matrix = matrixMultiply(matrix, translationMatrix);
    matrix = matrixMultiply(matrix, projectionMatrix);
  
    // set the matrix 
    gl.uniformMatrix4fv(matrixLocation, false, matrix);
    // draw the geometry 
    gl.lineWidth(4);
    gl.drawArrays(gl.LINES, 0, 100);
      
  }
  
  // make a matrix for each explosion 
  function drawExplosions( data ) {
    
    var len = data.length, i, explosion, state, info;
    
    explosions = [];
    numExplosions = 0;
    
    for(i = 0; i < len; ++i) {
            
      explosion = data[i];
      state = 1 - (explosion.lifespan / explosion.target);
      info = {};
      
      info.translation = [ explosion.x, explosion.y, 1 ];
      info.rotation = [ 0, 0, explosion.random + state * explosion.state ];
      info.scale = state ;//* explosion.random * Math.random() * 5;   
                  
      explosions.push( info );

      ++numExplosions;
    }
    
  }
  
  function drawRects(rects, colour) {
    
    numPoints += rects.length;
    
    var i = rects.length;
    
    while(i--) {
      
      points.push([rects[i].x, rects[i].y]);
      
    }
  }
  
  function drawParticles( particles ) {
    
    var len = particles.length;
    
    var i = 0, index = 0;
    
    for(i; i < MAX_VERTICES; i+=6) {
      
      var particle = particles[index++ % len];
      
      vertices[i]   = particle.x;
      vertices[i+1] = particle.y;
      vertices[i+2] = 0;
      
      vertices[i+3] = particle.ox;
      vertices[i+4] = particle.oy;
      vertices[i+5] = 0;
    }    
  }
  
  function clear() {
    // clear the points 
    numPoints = 0;
    points = [];
    
    // clear the canvas 
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
    
  return {
    init: init,
    drawRects: drawRects,
    drawScene: drawScene,
    drawParticles: drawParticles,
    drawExplosions: drawExplosions,
    clear: clear
  }
  
})();

module.exports = render;
},{"./config":1,"./webgl-utils":7}],5:[function(require,module,exports){
/**
 * Generated sound manager 
 */

// note frequencies 
var frequencies = {
  'a' : 440.00,
  'b' : 493.88,
  'c' : 523.25,
  'd' : 587.33,
  'e' : 659.25,
  'f' : 698.46,
  'g' : 783.99
};

// flag to allow sounds to play 
var contextReady = false;

// enable webAudio on iOS after first touch 
function enableiOS( context ) {
  
  function activateSound() {
    
    var source;
    // create empty buffer to trigger sound playback 
    source = context.createBufferSource();
    source.buffer = context.createBuffer( 1, 1, 22050 );
    source.connect( context.destination );
    source.start(0);
    
    window.removeEventListener( 'touchstart', activateSound, false );
    
    // audio context is unlocked, flag it up 
    contextReady = true;
  }
  
  window.addEventListener( 'touchstart', activateSound, false );
}

// create audio context 
var context = (function () {

  var context, AudioContext = window.AudioContext || window.webkitAudioContext;

  if ( AudioContext ) {
  
    context = new AudioContext();
  
    // enable iOS sound
    enableiOS( context );
  } 
  
  return context;    
})();

// Voltage controller oscillator
var VCO = (function ( context ) {
  
  function VCO( frequency ) {
  
    var osc;
  
    osc = context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency || 440;
    osc.detune.value = Math.pow(2, 1/12) * Math.random(); // Offset sound by 10 semitones
    osc.start(0);
  
    this.osc = osc;
    this.output = osc;
  
  }

  VCO.prototype.setFrequency = function ( frequency ) {
    this.osc.frequency.value = frequency;
  };

  VCO.prototype.connect = function ( node ) {
    this.output.connect( node );
  };

  return VCO;

})( context );

// Voltage controller amplifier
var VCA = (function ( context ) {

  function VCA() {
  
    var node;
  
    node = context.createGain();
    node.gain.value = 0.0;
  
    this.node = node;
    this.gain = node.gain;
  }

  VCA.prototype.connect = function ( node ) {
    this.node.connect( node );
  };

  return VCA;

})( context );

// Envelope generator 
var Envelope = (function ( context ) {

  function Envelope( attack, release ) {
  
    this.attack = attack;
    this.release = release;  
  }
  
  Envelope.prototype.trigger = function () {
      
    if ( !this.param ) {
      throw new Error( 'Attempt to trigger gate with no node connected' );
    }
    
    var now = context.currentTime;    
    
    this.param.cancelScheduledValues(now);
    this.param.setValueAtTime(0, now);
    this.param.linearRampToValueAtTime(1, now + this.attack);
    this.param.linearRampToValueAtTime(0, now + this.attack + this.release);    
  };
  
  Envelope.prototype.connect = function ( param ) {
    
    this.param = param;    
  };

  return Envelope;

})( context );

var SoundManager = (function () {
  
  var vcoA, vcoB, vcoC, vca, envelope;
  
  function play () {
    envelope.trigger();
  }
  
  function setup () {

    vcoA = new VCO( frequencies['a'] );
    vcoB = new VCO( frequencies['c'] );
    vcoC = new VCO( frequencies['e'] );
    vca = new VCA;
    envelope = new Envelope( 0.1, 1.0 );
    
    // wire them up! 
    vcoA.connect( vca.node );
    vcoB.connect( vca.node );
    vcoC.connect( vca.node );
    envelope.connect( vca.gain );
    vca.connect( context.destination );
    
  }
  
  setup();
  
  return {
    playPickup: play,
    playVanish: play,
    playStart: play
  };
  
})();


module.exports = SoundManager;
 

},{}],6:[function(require,module,exports){
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
  

},{}],7:[function(require,module,exports){
/**
 * WebGL Utility methods 
 */

var glUtils = (function () {
  
  var gl; 

  /**
   * Setup WebGL context if available 
   * @param {HTMLCanvasElement} canvas - The canvas to create context from
   * @return {WebGLRenderingContext}
   */
  function setupGL( canvas ) {
    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {}

    if (!gl) {
      throw new Error('Unable to initialise WebGL');    
    }
  
    return gl;
  }

  // Create and compile shader from source 
  function createShader( source, type ) {
  
    var shader = gl.createShader( type );
  
    gl.shaderSource( shader, source );
    gl.compileShader( shader );
  
    if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS) ) {
      throw gl.getShaderInfoLog( shader );
    }
  
    return shader;
  }

  // Create shader program and create & link shaders 
  function createProgram( vertexSrc, fragmentSrc ) {
  
    var vertexShader, fragmentShader, program;
  
    vertexShader = createShader( vertexSrc, gl.VERTEX_SHADER ),
    fragmentShader = createShader( fragmentSrc, gl.FRAGMENT_SHADER );
  
    program = gl.createProgram();
  
    gl.attachShader( program, vertexShader );
    gl.attachShader( program, fragmentShader );
    gl.linkProgram( program );
  
    if ( !gl.getProgramParameter( program, gl.LINK_STATUS) ) {
      throw gl.getProgramInfoLog( program );
    }
      
    return program;  
  }

  // Load glsl code into shaders object 
  function loadShaders( shaders, callback ) {
  
    var queue = 0;
    
    function loadHandler( name, req ) {
    
      return function () {      
        shaders[name] = req.responseText;
        if ( --queue <= 0 ) callback();
      }
    }
  
    for(var name in shaders) {
    
      queue++;
    
      var req = new XMLHttpRequest();
      req.onload = loadHandler( name, req );
      req.open( 'get', 'glsl/' + name + '.glsl', true);
      req.send();
    
    }
  }
  
  return {
    setupGL: setupGL,
    loadShaders: loadShaders,
    createProgram: createProgram
  };
})();

// WebGL context 
module.exports = glUtils;

},{}]},{},[2])