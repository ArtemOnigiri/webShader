const cnv = document.getElementById('cnv');
const width = cnv.width = window.innerWidth;
const height = cnv.height = window.innerHeight;
const gl = cnv.getContext('webgl2');

const cnv2d = document.getElementById('cnv2d');
cnv2d.width = 200;
cnv2d.height = 100;
const ctx = cnv2d.getContext('2d');
ctx.font = '32px sans-serif';

const vertexShaderCode =
	`#version 300 es
	in vec2 a_position;
	in vec2 a_texcoord;
	out vec2 v_texcoord;
	void main() {
		v_texcoord = a_texcoord;
		gl_Position = vec4(a_position, 0.0, 1.0);
	}
`;

const fragmentShaderCode =
	`#version 300 es
	precision mediump float;
	uniform float u_time;
	uniform float u_aspect;
	in vec2 v_texcoord;
	out vec4 outColor;

	vec2 cpow(vec2 c, float exponent)
	{
		if (abs(c.x) < 1e-5 && abs(c.y) < 1e-5) {
			return vec2(0,0);
		}
		else {
			float cAbs = length(c);
			vec2  cLog = vec2(log(cAbs), atan(c.y,c.x));
			vec2  cMul = exponent*cLog;
			float expReal = exp(cMul.x);
			return vec2(expReal*cos(cMul.y), expReal*sin(cMul.y));
		}
	}

	void main()
	{
		vec2 uv = v_texcoord * 2.0 - 1.0;
		uv.x *= u_aspect;
		float n = sin(u_time * 0.001) * 2.0 - 3.0;
		float zoo = 2.0;
		vec2 c = vec2(.0,.0) + uv*zoo;
		vec2 z  = vec2(0.0);
		float m2 = 0.0;
		vec2 dz = vec2(0.0);
		for( int i=0; i<256; i++ )
		{
			if( m2>1024.0 ) break;
			vec2 chain = n * cpow(z, n - 1.0);
			dz = mat2(chain,-chain.y,chain.x) * dz + vec2(1,0);
			z = cpow(z, n) + c;
			m2 = dot(z, z);
		}
		float d = 0.5*sqrt(m2/dot(dz,dz))*log(m2);
		d = pow(d, 0.25) * 32.0;
		vec3 col = 0.5 + 0.5*cos( 3.0 + d*0.15 + vec3(0.0,0.6,1.0));
		// vec3 col = vec3( d );
		outColor = vec4( col, 1.0 );
	}
`;

const quad = [
	-1, -1,
	 1, -1,
	 1,  1,
	 1,  1,
	-1,  1,
	-1, -1,
];

const textCoords = [
	0, 0,
	1, 0,
	1, 1,
	1, 1,
	0, 1,
	0, 0,
];

let time = 0;
let currentTime = Date.now();
let interval;
let timeLocation;
initGL();

function initGL() {
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.compileShader(vertexShader);
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderCode);
	gl.compileShader(fragmentShader);
	console.log(gl.getShaderInfoLog(fragmentShader));

	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
	const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");
	timeLocation = gl.getUniformLocation(program, 'u_time');
	const aspectLocation = gl.getUniformLocation(program, 'u_aspect');
	gl.useProgram(program);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	const texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textCoords), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(texcoordAttributeLocation);
	gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	let aspect = cnv.clientWidth / cnv.clientHeight;
	gl.uniform1f(aspectLocation, aspect);

	interval = setInterval(update, 17);
}

function update() {
	let currentTimeNew = Date.now();
	let deltaTime = currentTimeNew - currentTime;
	time += deltaTime;
	currentTime = currentTimeNew;
	gl.uniform1f(timeLocation, time);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	ctx.clearRect(0, 0, 200, 100);
	ctx.fillText(~~(1000 / deltaTime), 10, 50);
}