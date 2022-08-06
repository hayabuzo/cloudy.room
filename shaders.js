shader_vert =
` attribute vec3 aPosition; attribute vec2 aTexCoord; varying vec2 vTexCoord;
void main() { vTexCoord = aTexCoord; vec4 positionVec4 = vec4(aPosition, 1.0);  
positionVec4.xy = positionVec4.xy * 2.0 - 1.0; gl_Position = positionVec4; }`;

shader_uniforms = `
precision mediump float; varying vec2 vTexCoord;
uniform sampler2D   TXP, TXF, FCM, PIC, BGR, TXB;
uniform float       WIDTH,    HEIGHT,   H2W, 
                    FRC, SCL,
                    MX, MY, PW, PH, PX, PY,
										ctrl_depth, ctrl_light, ctrl_amplitude; `;

shader_frag = [];

shader_frag[0] = shader_uniforms + library + ` void main() {

vec2  uv = vTexCoord; uv.y = 1.0 - uv.y;
vec2  uvp = (uv - vec2(PX,PY)) * (1.0/SCL) / vec2(PW/WIDTH,PH/HEIGHT) + 0.5;

// DISPLACE
			
float mask = (1.0-fg2circ(uv,vec2(0.5,0.5),0.5,1.0))*0.8+0.2;

float ks = 1.0;
float ka = ctrl_depth;
float an = PI*0.6;
float km = 0.07;

vec2  uvs = uv2rot(uvp,an);
      uvs.x += sin(FRC*ks*0.9)*ka;
      uvs = uv2rot(uvs,-an);
      uvs.x += sin(FRC*ks)*ka;

vec4  imb = texture2D(TXB, uvp);
float avb = img2avg(imb) * km * mask;

vec4  img = texture2D(PIC, mix(uvp,cnv2abs(uvs),avb) );
			
// CHROME

float kx1 = 0.50;
float ky1 = 0.75;
float ks1 = 0.05;

float avg = 1.0-img2avg(img);
      avg = sin(img2avg(img)*PI);
vec2  uvd = uv2rot( (uv-vec2(PX,PY))*(1.0/SCL) ,mod(FRC*0.01*PI,TWO_PI))-f2z(avg)*0.5;
vec2  uvn1 = uvd*vec2(kx1,ky1)+vec2(-FRC*ks1,0.0);
      uvn1 = uvn1*10.0;
float n1 = uv2noise2(uvn1)-0.5;

// BLOOM

float sx2 = 0.07;
float kx2 = 0.00;
float	ky2 = 0.035;
			
vec2  uvn2 = uv2rot( (uv-vec2(PX,PY))*(1.0/SCL) ,PI*img2avg(imb))*vec2(kx2,ky2)+vec2(-FRC*0.1*sx2,0.0);
float	n2 = uv2noise2(uvn2*80.0)-0.5;

float n = (n1*avg + n2) * ctrl_light;

			img = mix2scr(img,img,n);
			
      gl_FragColor = img; 
			
} `;


shader_frag[1] = shader_uniforms + library + ` void main() {

vec2  uv = vTexCoord; uv.y = 1.0 - uv.y;

// RADIAL BLUR

vec4  img = vec4(0.0);
const float passes = 7.0;
float kf = 1.0;
float ks = 1.0;
float ka = sin(FRC*0.5)*ctrl_amplitude;
float kz = ka/passes;
vec2  uvs;

      for (float i=0.0; i<passes; i+=1.0) {
        uvs = xy2md(uv-0.5);
        uvs.x += sin(-FRC*ks+uvs.y*kf)*uvs.x*ka*i/passes;
        uvs = md2xy(uvs)+0.5;
        img += texture2D(TXP, uv2exp(uvs,i*kz,0.0,0.0));
      } 
			
	img /= passes;

      vec2  uvp = (uv - vec2(PX,PY)) * (1.0/SCL) / vec2(PW/WIDTH,PH/HEIGHT) + 0.5;
      img = mix(img, tx2d(TXP,uv), tx2d(FCM,uvp).r);

// BACKGROUND
			
float f = a2cnv(uvp);
			
float d = z2f(sin(FRC*0.015))*0.4;
vec4  ml = mix( tx2d(BGR,vec2(0.0+d,0.0+d)), tx2d(BGR,vec2(0.0+d,1.0-d)), uv.y );
vec4  mr = mix( tx2d(BGR,vec2(1.0-d,0.0+d)), tx2d(BGR,vec2(1.0-d,1.0-d)), uv.y );
		
vec4  i0 =  tx2d(TXF,uv);
vec4  i1b = mix(ml,mr,uv.x);
vec4  black = vec4(0.0,0.0,0.0,1.0);


			img = mix(
			mix( i0,    i1b,   clamp(FRC-0.3,0.0,1.0)),
			img,
			f *                clamp(FRC-0.9,0.0,1.0));
			
      gl_FragColor = img;
			
}`;

