var pic, stk, minpic, imb, imgx, shadersArray, fcm,
    picFit, upScale = 2.0,
    target = {}, current = {},
    buttons, toolbar;

function setup() {
	background(255); initButtons(); initValues();	
	extLoad = false;
	url = getURL().split("?img=")[1];
	if (getURL().split("?img=")[1]=="") fileName = "img.jpg";
	else if (url!==undefined) { fileName = url; extLoad = true; }
	else fileName = "img.jpg";

	picLoad = loadImage(fileName); fileName = getName(fileName);
  file_input = createFileInput(newPic); file_input.id('myInput').style('visibility:hidden'); 
}

function preload() {
	logo = loadImage("logo.jpg");
}

function initButtons() {
	toolbar = { hide:"⚙️", open:"📂" }; menu = { w:200, h:50, b:10 };
	buttons = { light:0.5, depth:0.5, blur:0.075*3.3*2.0, dust:0.5 }; 
	let n=0; for (let i in buttons) { xm = buttons[i]; buttons[i] = new button( 0, menu.h+menu.b+menu.h*n, menu.w, menu.h, menu.b); buttons[i].txt[0] = i; buttons[i].xm = xm; n++; }
  for (let i in toolbar) { let t = toolbar[i]; toolbar[i] = new button( 0, menu.b, menu.h, menu.h, menu.b); toolbar[i].txt[0] = t; toolbar[i].cross = false; n++; }
}

function initValues() {
	canvas = createCanvas(windowWidth, windowHeight); canvas.drop(newPic);
	imgx = createGraphics(width,height, WEBGL);
	stk  = createGraphics(width,height); stk.background(0); stk.push(); stk.imageMode(CENTER); stk.image(logo,width/2,height/2); stk.pop();
	pic  = createGraphics(width,height); picFit = 0.0;
	imb  = createGraphics(width,height);
	fcm  = createGraphics(width,height);
	minpic = createGraphics(100,100);
	current = { picX:width/2, picY:height/2, scale:0, menuX:menu.w+menu.b*2, textY:-40 }; for (let i in current) { target[i] = current[i]; }
	shadersArray = []; for (let i=0; i<shader_frag.length; i++) {	shadersArray[i] = imgx.createShader(shader_vert, shader_frag[i]); } 
}

function newPic(file) { 
  if (file.type === 'image') picLoad = loadImage(file.data, picLoad => { 
	  picFit = 0; doPic(); frameCount = 0;
		fileName = getName(file.name);
	});
}

function draw() {
  doPic(); doShaders();
	image(stk,0,0,width,height);
  drawButtons(); }

function doPic() {
	if(picLoad.width>1) {
		for (let i in current) { current[i] += (target[i] - current[i]) / 10; }
		if (picFit==0) {
			minpic.image(picLoad,0,0,100,100);
			picFit = scaleFit(windowWidth,windowHeight,picLoad.width,picLoad.height);
			current.scale = target.scale = 0.95; target.picX = current.picX = width/2;  target.picY = current.picY = height/2;
			imb = createGraphics(picLoad.width*picFit,picLoad.height*picFit); imb.image(picLoad,0,0,imb.width,imb.height); imb.filter(BLUR, imb.width*0.003);
			picFit*=upScale; pic = createGraphics(picLoad.width*picFit,picLoad.height*picFit); pic.image(picLoad,0,0,pic.width,pic.height); 
			doFaceDetection();
		}
		drawDust();
	}
}

function doFaceDetection() {
	fcm = createGraphics(pic.width/3.0, pic.height/3.0);
	fcm.image(pic,0,0,fcm.width,fcm.height)
	let classifier = objectdetect.frontalface;
	let scaleFactor = 1.2;
	let detector = new objectdetect.detector(fcm.width, fcm.height, scaleFactor, classifier);
	let faces = detector.detect(fcm.canvas);
	fcm.background(0);
	if (faces) { for (let i in faces) { let face = faces[i]; if (face[4]>4) fcm.noStroke().fill(255).ellipseMode(CORNER).ellipse(face[0], face[1], face[2], face[3]); }	}
	fcm.filter(BLUR, fcm.width*0.01);
}

function doShaders() { for (let i in shader_frag) {  imgx.shader(shadersArray[i]).rect(0,0,1,1); uniSend(shadersArray[i]); } if (frameCount > 5) stk.image(imgx,0,0,width,height); }

function drawButtons() {
	if (!extLoad) fill(255).noStroke().text(fileName,20,current.textY);
	let n = 1; for (let i in toolbar) { toolbar[i].x = windowWidth-menu.h*n-menu.b; n++; toolbar[i].show();	}
	if (toolbar.open.clicked) document.getElementById('myInput').click();
	if (toolbar.hide.clicked) { target.menuX = target.menuX == 0 ? menu.w+menu.b*2 : 0; target.textY = target.textY == 20 ? -40 : 20; }
	let bpr = false; for (let i in buttons) { buttons[i].x = windowWidth-menu.w-menu.b + current.menuX; buttons[i].show(); if (buttons[i].pressed) bpr = true; }
  if (mouseIsPressed && !bpr) { target.picX += mouseX-pmouseX; target.picY += mouseY-pmouseY; }
}

function uniSend(s) {
	s.setUniform( 'WIDTH'  , width  );        	s.setUniform( 'HEIGHT' , height ); 
	s.setUniform( 'PW' , pic.width/upScale ); 	s.setUniform( 'PH' , pic.height/upScale ); 
	s.setUniform( 'PX' , current.picX/width ); 	s.setUniform( 'PY' , current.picY/height ); 
	s.setUniform( 'MX' , mouseX/width );      	s.setUniform( 'MY' , mouseY/height ); 
	s.setUniform( 'H2W' , width/height  );  	  s.setUniform( 'SCL' , current.scale ); 
  s.setUniform( 'PIC' , pic );                s.setUniform( 'TXF' , stk );
  s.setUniform( 'TXB' , imb );                s.setUniform( 'BGR' , minpic ); 
	s.setUniform( 'TXP' , imgx );               s.setUniform( 'FCM' , fcm ); 
  s.setUniform( 'ctrl_depth'  ,    buttons.depth.xm*0.08 );
  s.setUniform( 'ctrl_light' ,     buttons.light.xm*1.5  );
  s.setUniform( 'ctrl_amplitude' , buttons.blur.xm*0.033 );
	s.setUniform( 'FRC' , frameCount/60 ); 

}

function mouseWheel(event) { target.scale = constrain(target.scale + event.delta*target.scale*0.002,0.5,max(2.0,picLoad.width/width*2.0)); }
function mouseReleased() { if (mouseButton == CENTER) if (target.scale != width/(pic.width/upScale)) target.scale = width/(pic.width/upScale); else target.scale = 0.95; }

function scaleFit(outW, outH, insW, insH) {	if (outW/outH<insW/insH) k = outW/insW;	else k = outH/insH;	return k; }
function windowResized() { initValues(); }

function getName(s) {	return s.split(".").slice(0,-1).join(""); }

function drawDust() {
	pic.image(picLoad,0,0,pic.width,pic.height); 
  let h = pic.height * 1.2;
  let w = pic.width  * 1.2;
  for (let i=0; i<buttons.dust.xm*100; i++) { pic.blendMode(OVERLAY);
  	pic.noStroke().fill(255,(1-1.5*noise(200*i+frameCount/300))*100);
  	pic.circle(sin(1000*i+frameCount/2000*(i/20))*w,noise(1000*i+frameCount/600)*h,noise(200*i+frameCount/300)*current.scale*10);
  	pic.blendMode(BLEND); }
}