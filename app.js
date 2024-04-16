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


	var t = 0;
	var gridSize = 101;
	var domSize = 5;
	var scalingFactor = 1/domSize;


function main() {
	// Get A WebGL context
	var canvas = document.querySelector("#c");
	var gl = canvas.getContext("webgl");
	if (!gl) {
	return;
	}

	// Get the strings for our GLSL shaders
	var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
	var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

	var userFunctionInput = document.getElementById("function-input").value;

	if(userFunctionInput != "") 
		vertexShaderSource = vertexShaderSource.replace("//USERDEFINED", "return " + userFunctionInput + ";")

	// create GLSL shaders, upload the GLSL source, compile the shaders
	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	// Link the two shaders into a program
	var program = createProgram(gl, vertexShader, fragmentShader);

	// look up where the vertex data needs to go.
	var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

	// Create a buffer and put three 2d clip space points in it
	var positionBuffer = gl.createBuffer();

	// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	// Set background colour
	gl.clearColor(1.0,1.0,1.0, 1.0);


	// Tell WebGL how to convert from clip space to pixels
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// Tell it to use our program (pair of shaders)
	gl.useProgram(program);

	// Turn on the attribute
	gl.enableVertexAttribArray(positionAttributeLocation);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	var size = 2;          // 2 components per iteration
	var type = gl.FLOAT;   // the data is 32bit floats
	var normalize = false; // don't normalize the data
	var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(
	  positionAttributeLocation, size, type, normalize, stride, offset);
	var offset = 0;

    var domainMatLoc = gl.getUniformLocation(program, "u_dom_mat");
	var rangeMatLoc = gl.getUniformLocation(program, "u_ran_mat");
	var scalingFactorLoc = gl.getUniformLocation(program, "u_scaling_factor");


	var primitiveType = gl.LINES;

	var aspectRatio = canvas.width / canvas.height

	gl.uniform1f(scalingFactorLoc, scalingFactor);

	var positions = Array();

	for (let xGrid = 0; xGrid < gridSize + 1; xGrid++) { 
		for (let yGrid = 0; yGrid < gridSize + 1; yGrid++) 
		{ 
			var x = (xGrid / gridSize - 0.5) * domSize;
			var y = (yGrid / gridSize - 0.5) * domSize;

			if(xGrid < gridSize)
			{
				positions.push(x);
				positions.push(y);	
				positions.push(x + 1.0 / gridSize * domSize);
				positions.push(y);
			}

			if(yGrid < gridSize)
			{
				positions.push(x);
				positions.push(y);	
				positions.push(x);
				positions.push(y + 1.0 / gridSize* domSize);
			}
		}
	}

	var count = positions.length / size;

	drawFrame();

function drawFrame()
{
	gl.clear(gl.COLOR_BUFFER_BIT);

	t += 0.01;

	var theta = t;
	var phi = 0.1 * t;

	var domainToScreenMatrix = [
		Math.cos(0), Math.sin(0) * aspectRatio, 0, 0,
		Math.sin(theta), -Math.cos(theta) * aspectRatio, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];

	var rangeToScreenMatrix = [
		Math.cos(phi), Math.sin(phi) * aspectRatio, 0, 0,
		Math.sin(0), -Math.cos(0) * aspectRatio, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];

	gl.uniformMatrix4fv(domainMatLoc, false, domainToScreenMatrix);
	gl.uniformMatrix4fv(rangeMatLoc, false, rangeToScreenMatrix);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	// Bind the position buffer.
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	// draw
	
	gl.drawArrays(primitiveType, offset, count);

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

main();
