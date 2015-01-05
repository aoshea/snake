var utils  = require('./utils');
var render = require('./render');
var sound = require('./sound');
var root = window;

/** 
 * Snake game with particle effects
 */ 

var constants = {
  FRICTION: 0.9,
  MAX_PARTICLES: 100,
  LEFT: 1,
  UP: 2,
  RIGHT: 4,
  DOWN: 8,
  GRID_SIZE: 8,
  SPEED: 3
};

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
        
    this.x += ( constants.FRICTION * this.x ) - ( constants.FRICTION * this.ox ) + this.ax;
    this.y += ( constants.FRICTION * this.y ) - ( constants.FRICTION * this.oy ) + this.ay;

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
  w: constants.GRID_SIZE,
  h: constants.GRID_SIZE
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
    
    var i = constants.MAX_PARTICLES, particle;
    
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
    
    var i = constants.MAX_PARTICLES;
    
    while(i--) {      
      this.particles[i].update();            
    }    
  }, 
  
  constrainParticles: function () {
    
    var i = constants.MAX_PARTICLES;
    
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
    if ( !(direction & constants.LEFT) && !(lastDirection & constants.RIGHT) ) {
      direction += constants.LEFT;            
    }
  },
  
  moveRight: function () {
    if ( !(direction & constants.RIGHT) && !(lastDirection & constants.LEFT) ) {
      direction += constants.RIGHT;            
    }
  },
  
  moveUp: function () {
    if ( !(direction & constants.UP) && !(lastDirection & constants.DOWN) ) {
      direction += constants.UP;            
    }
  },
  
  moveDown: function () {
    if ( !(direction & constants.DOWN) && !(lastDirection & constants.UP) ) {
      direction += constants.DOWN;      
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
        if (direction & constants.LEFT) {
          direction -= constants.LEFT;            
        }
        break;
      case 38:    
        if (direction & constants.UP) {
          direction -= constants.UP;            
        }
        break
      case 39:             
        if (direction & constants.RIGHT) {
          direction -= constants.RIGHT;            
        }
        break;
      case 40:           
        if (direction & constants.DOWN) {
          direction -= constants.DOWN;            
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
      w: constants.GRID_SIZE, 
      h: constants.GRID_SIZE, 
      lifespan:lifespan || 150
    };
  },
  getRandomCell: function () {
    
    var step = constants.GRID_SIZE;
    
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
      
      var a, b, c, d, step = constants.GRID_SIZE;
      
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
    
    var step = constants.GRID_SIZE;
    
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

    if ((++this.frame % constants.SPEED) === 0) {      
      
      if (direction & constants.LEFT) {
        accel.x = -1;
        accel.y = 0;
      }
      if (direction & constants.RIGHT) {
        accel.x = 1;
        accel.y = 0;
      }
      if (direction & constants.UP) {
        accel.y = -1;      
        accel.x = 0;    
      }
      if (direction & constants.DOWN) {
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
          
          var m = constants.GRID_SIZE;
          
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
