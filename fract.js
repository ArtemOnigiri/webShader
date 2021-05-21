const cnv = document.getElementById('cnv');
const width = cnv.width = window.innerWidth;
const height = cnv.height = window.innerHeight;
const gl = cnv.getContext('webgl2');

const cnv2d = document.getElementById('cnv2d');
cnv2d.width = 200;
cnv2d.height = 200;
const ctx = cnv2d.getContext('2d');
ctx.font = '32px sans-serif';
ctx.fillStyle = '#fff';
ctx.strokeStyle = '#000';
ctx.lineWidth = 4;

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
	uniform vec2 u_mouse;
	in vec2 v_texcoord;
	out vec4 outColor;

	vec2 cpow2(vec2 c, vec2 e)
    {
    	if (abs(c.x) < 1e-5 && abs(c.y) < 1e-5) {
			return vec2(0,0);
		}
        float r = length(c);
        float theta = atan(c.y, c.x);
        float f1x = pow(r, e.x) * exp(-e.y * theta);
        float f2x = cos(e.y * log(r) + e.x * theta);
        float f2y = sin(e.y * log(r) + e.x * theta);
        return vec2(f1x * f2x, f1x * f2y);

    }

	void main()
	{
		vec2 uv = v_texcoord * 2.0 - 1.0;
		uv.x *= u_aspect;
		float zoo = 2.0;
		vec2 c = vec2(.0,.0) + uv * zoo;
		vec2 z  = vec2(0.0);
		float m2 = 0.0;
		vec2 dz = vec2(0.0);
		for(int i = 0; i < 256; i++)
		{
			if( m2 > 1024.0 ) break;
			vec2 chain = u_mouse.x * cpow2(z, u_mouse + vec2(-1.0, 0.0));
			dz = mat2(chain, -chain.y, chain.x) * dz + vec2(1,0);
			z = cpow2(z, u_mouse) + c;
			m2 = dot(z, z);
		}
		float d = 0.5 * sqrt(m2 / dot(dz, dz)) * log(m2);
		d = pow(d, 0.125) * 32.0;
		vec3 col = 0.5 + 0.5 * cos(3.0 + d * 0.15 + vec3(1.0, 0.6, 0.0));
		outColor = vec4(col, 1.0);
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
let mouseLocation;
let mx = 0;
let my = 0;
document.addEventListener('mousemove', mouseMove);
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
	const aspectLocation = gl.getUniformLocation(program, 'u_aspect');
	timeLocation = gl.getUniformLocation(program, 'u_time');
	mouseLocation = gl.getUniformLocation(program, 'u_mouse');
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
	let mxs = mx * 5;
	let mys = my * 5;
	gl.uniform1f(timeLocation, time * 0.001);
	gl.uniform2f(mouseLocation, mxs, mys);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	ctx.clearRect(0, 0, 200, 200);
	ctx.strokeText(~~(1000 / deltaTime), 10, 50);
	ctx.fillText(~~(1000 / deltaTime), 10, 50);
	let x = ~~mxs + (~~((mxs % 1) * 100)) / 100;
	let y = ~~mys + (~~((mys % 1) * 100)) / 100;
	x = x + '';
	if(x.length > 4) x = x.substring(0, 4);
	y = y + '';
	if(y.length > 4) y = y.substring(0, 4);
	ctx.strokeText(x + ' ' + y, 10, 100);
	ctx.fillText(x + ' ' + y, 10, 100);
}

function mouseMove(e) {
	mx = e.clientX / width * 2 - 1;
	my = e.clientY / height * 2 - 1;
}