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
