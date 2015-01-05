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