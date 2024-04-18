
var xpos  = 0;
var ypos = 0;

var xdelta = 0;
var xdelta = 0;

var angle_a = 0;
var angle_b = 0;
var angle_c = 0;
var angle_d = 0;

var sensitivity = 0.01;

// dragging controls
OnDragCanvas = function(event) {


	xpos = event.pageX;
	ypos = event.pageY;
	
  // centers the ball at (pageX, pageY) coordinates
  function moveAt(pageX, pageY) {
	  xdelta = pageX - xpos;
	  ydelta = pageY - ypos;
    xpos = pageX;
    ypos = pageY;
	
	angle_a += sensitivity * xdelta;
	angle_b += sensitivity * ydelta;
  }

  // move our absolutely positioned ball under the pointer
  moveAt(event.pageX, event.pageY);

  function onMouseMove(event) {
    moveAt(event.pageX, event.pageY);
  }

  // (2) move the ball on mousemove
  document.addEventListener('mousemove', onMouseMove);

  // (3) drop the ball, remove unneeded handlers
  document.onmouseup = function() {
    document.removeEventListener('mousemove', onMouseMove);
    document.onmouseup = null;
  };

};




var aspectRatio;

function InitializeWebGLEnvironment(canvas)
{
	// Get A WebGL context
	var gl = canvas.getContext("webgl");
	
	if (!gl) {
	return;
	}
	
	aspectRatio = canvas.width / canvas.height;
		
	// Tell WebGL how to convert from clip space to pixels
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	return gl;
}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

var programFuncEval;
var programDirect;

function createShaderPrograms(gl)
{
	// Get the strings for our GLSL shaders
	var funcEvalVertexShaderSource = document.querySelector("#func-eval-vertex-shader").text;
	var directVertexShaderSource = document.querySelector("#direct-vertex-shader").text;
	
	var fragmentShaderSource = document.querySelector("#fragment-shader").text;

	var userFunctionInput = document.getElementById("function-input").value;

	if(userFunctionInput != "") 
		funcEvalVertexShaderSource = funcEvalVertexShaderSource.replace("//USERDEFINED", "return " + userFunctionInput + ";")

	// create GLSL shaders, upload the GLSL source, compile the shaders
	var func_eval_vs = createShader(gl, gl.VERTEX_SHADER, funcEvalVertexShaderSource);
	var direct_vs = createShader(gl, gl.VERTEX_SHADER, directVertexShaderSource);

	var fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
	
	// Link the two shaders into a program
	programFuncEval = createProgram(gl, func_eval_vs, fs);
	programDirect = createProgram(gl , direct_vs, fs);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

var domainToScreenMatrix;
var rangeToScreenMatrix

var t = 0;
var gridSize = 101;
var domSize = 5;
var scalingFactor = 1/domSize;

// Generate Grid Mesh
var gridMesh = Array();
for (let xGrid = 0; xGrid < gridSize + 1; xGrid++) { 
	for (let yGrid = 0; yGrid < gridSize + 1; yGrid++) 
	{ 
		var x = (xGrid / gridSize - 0.5) * domSize;
		var y = (yGrid / gridSize - 0.5) * domSize;

		if(xGrid < gridSize)
		{
			gridMesh.push(x);
			gridMesh.push(y);	
			gridMesh.push(x + 1.0 / gridSize * domSize);
			gridMesh.push(y);
		}

		if(yGrid < gridSize)
		{
			gridMesh.push(x);
			gridMesh.push(y);	
			gridMesh.push(x);
			gridMesh.push(y + 1.0 / gridSize* domSize);
		}
	}
}

function main() {
	
	var canvas = document.querySelector("#c");
	var gl = InitializeWebGLEnvironment(canvas);
		
	// Set background colour
	gl.clearColor(0.5, 0.5, 0.5, 1.0);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	createShaderPrograms(gl);
	
	var gridPositionBuffer = gl.createBuffer();	// Create a buffer and put three 2d clip space points in it
	gl.bindBuffer(gl.ARRAY_BUFFER, gridPositionBuffer);	// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridMesh), gl.DYNAMIC_DRAW);
	
	drawFrame();

function drawFrame()
{
	gl.clear(gl.COLOR_BUFFER_BIT);

	t += 0.01;
	
	//angle_a = document.getElementById("angle-a").value;
	//angle_b = document.getElementById("angle-b").value;
	angle_c = document.getElementById("angle-c").value;
	angle_d = document.getElementById("angle-d").value;
	
	var domain_scale = document.getElementById("domain-scale").value * scalingFactor;
	var range_scale = document.getElementById("range-scale").value * scalingFactor;
	
	domainToScreenMatrix = [
		Math.cos(angle_a) * domain_scale, Math.cos(angle_b) * aspectRatio * domain_scale, 0, 0,
		Math.sin(angle_a) * domain_scale, Math.sin(angle_b) * aspectRatio * domain_scale, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];

	rangeToScreenMatrix = [
		Math.cos(angle_c) * range_scale, Math.cos(angle_d) * aspectRatio * range_scale, 0, 0,
		Math.sin(angle_c) * range_scale, Math.sin(angle_d) * aspectRatio * range_scale, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];
	
	var axesMesh = [0.0, 0.0, domainToScreenMatrix[0], domainToScreenMatrix[1],
					0.0, 0.0, domainToScreenMatrix[4], domainToScreenMatrix[5],
					0.0, 0.0, rangeToScreenMatrix[0], rangeToScreenMatrix[1],
					0.0, 0.0, rangeToScreenMatrix[4], rangeToScreenMatrix[5]];
					
	var axesPositionBuffer = gl.createBuffer();	// Create a buffer and put three 2d clip space points in it
	gl.bindBuffer(gl.ARRAY_BUFFER, axesPositionBuffer);	// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axesMesh), gl.DYNAMIC_DRAW);
	
	function drawPositionsWithProgram(positionBuffer, bufferLength, program)
	{		
		// Bind the position buffer.
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		
		var positionAttributeLocation = gl.getAttribLocation(program, "a_position");	// look up where the vertex data needs to go.
		gl.enableVertexAttribArray(positionAttributeLocation);	// Turn on the attribute
		gl.vertexAttribPointer(
		  positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)

		gl.useProgram(program);	// Tell it to use our program (pair of shaders)

		var domainMatLoc = gl.getUniformLocation(program, "u_dom_mat");
		var rangeMatLoc = gl.getUniformLocation(program, "u_ran_mat");

		gl.uniformMatrix4fv(domainMatLoc, false, domainToScreenMatrix);
		gl.uniformMatrix4fv(rangeMatLoc, false, rangeToScreenMatrix);


		// draw
		gl.drawArrays(gl.LINES, 0, bufferLength/2);
	}
	
	drawPositionsWithProgram(gridPositionBuffer, gridMesh.length, programFuncEval);
	drawPositionsWithProgram(axesPositionBuffer, axesMesh.length, programDirect);
	
	if(animate)
	{
		requestAnimationFrame(drawFrame);
	}else{
		animate = true;
		main();
	}
	}
}

var animate = true;

function reloadFunction()
{
animate = false;
}

function DrawMeshWithShader()
{
	
}

main();
