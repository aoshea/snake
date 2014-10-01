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
