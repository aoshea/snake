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
