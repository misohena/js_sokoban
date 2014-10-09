// Title: JavaScript Puzzle Game Warehouse keeper
// Author: AKIYAMA Kouhei
// Since: 2009-03

(function(global){
if(!global.misohena){ global.misohena = {};}
if(!global.misohena.js_sokoban){ global.misohena.js_sokoban = {};}
var mypkg = global.misohena.js_sokoban;

var Vec3 = mypkg.Vec3;
var Mat44 = mypkg.Mat44;
var drawSurface = mypkg.drawSurface;
var Surface = mypkg.Surface;

// ---------------------------------------------------------------------------
// ImageSet
// ---------------------------------------------------------------------------

/**
 * 使用する画像の集合を保持するクラスです。
 */
function ImageSet()
{
    this.imageCountTotal = 0;
    this.imageCountLoaded = 0;
    this.listeners = { onprogress : new Array(), oncomplete: new Array()};
}
ImageSet.prototype = {
    addImage: function(src)
    {
	var im = new Image();
	var th = this;
	im.onload = function(){ th.onLoadImage();};
	im.src = src;
	++this.imageCountTotal;
	return im;
    },
    addEventListener: function(eventName, f)
    {
	this.removeEventListener(f);

	var con = this.listeners[eventName];
	if(con){
	    con.push(f);
	}
    },
    removeEventListener: function(eventName, f)
    {
	var con = this.listeners[eventName];
	if(con){
	    for(var i = 0; i < con.length; ++i){
		if(con[i] == f){
		    con.splice(i, 1);
		    --i;
		}
	    }
	}
    },
    dispatchEvent: function(eventName)
    {
	var con = this.listeners[eventName];
	if(con){
	    // 最低限dispatch中のリスナーを削除できるよう、末尾から走査する。
	    // ちょっと問題あり。
	    for(var i = con.length - 1; i >= 0; --i){
		con[i](this);
	    }
	}
    },

    onLoadImage: function()
    {
	++this.imageCountLoaded;
	this.dispatchEvent("onprogress");
	if(this.isComplete()){
	    this.dispatchEvent("oncomplete");
	}
    },
    isComplete: function()
    {
	return this.imageCountLoaded >= this.imageCountTotal;
    },
    getLoadCount: function()
    {
	return this.imageCountLoaded;
    },
    getTotalCount: function()
    {
	return this.imageCountTotal;
    }
};

/**
 * 画像の読み込み状況をcanvas要素へ描画します。
 * ImageSetのonProgressへ設定して使います。
 */
function drawImageLoadProgressBar(imgs, canvas)
{
    if(!canvas || !canvas.getContext){
	return;
    }
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0,0,canvas.width,canvas.height);
    var barLeft = canvas.width*2/10;
    var barTop = canvas.height*4/10;
    var barWidth = canvas.width*6/10;
    var barHeight = canvas.height*1/10;
    ctx.fillRect(barLeft,
		 barTop,
		 barWidth * imgs.getLoadCount() / imgs.getTotalCount(),
		 barHeight);
    ctx.strokeRect(barLeft, barTop, barWidth, barHeight);
}



// ---------------------------------------------------------------------------
// MazeUtil
// ---------------------------------------------------------------------------

var MazeUtil = mypkg.MazeUtil = {
    /**
     * 配列中の一番大きい要素を返します。
     */
    maxElement: function(arr, predLess)
    {
	if(arr.length <= 0){
	    return null;
	}
	var result = arr[0];
	for(var i = 1; i < arr.length; ++i){
	    if(predLess(result, arr[i])){
		result = arr[i];
	    }
	}
	return result;
    },

    /**
     * 文字列を\nで切り分けた配列を返します。
     */
    splitLines: function(str)
    {
	var lines = new Array();
	lines.push("");
	var chprev = null;
	for(var i = 0; i < str.length; ++i){
	    var ch = str.charAt(i);
	    if(ch == '\n' || ch == '\r'){
		if(!(chprev == '\n' || chprev == '\r')){
		    lines.push("");
		}
	    }
	    else{
		lines[lines.length-1] += ch;
	    }
	    chprev = ch;
	}
	return lines;
    },

    /**
     * 要素の絶対座標を求めます。
     */
    getElementAbsPos: function(elem)
    {
	var x = 0;
	var y = 0;
	while(elem && elem.offsetLeft && elem.offsetTop){
	    x += elem.offsetLeft;
	    y += elem.offsetTop;
	    elem = elem.offsetParent;
	}

	return {x:x, y:y};
    },

    /**
     * マウスイベントの指定要素上での座標を求めます。
     */
    getMousePosOnElement: function(elem, ev)
    {
	if(!ev){ev = event;}
	if(elem.getBoundingClientRect){
	    var bcr = elem.getBoundingClientRect();
	    var x = ev.clientX - bcr.left;
	    var y = ev.clientY - bcr.top;
	    return {x:x, y:y};
	}
	else if(typeof(ev.pageX) == "number" && typeof(ev.pageY) == "number"){
	    var pos = MazeUtil.getElementAbsPos(elem);
	    return {x:ev.pageX-pos.x, y:ev.pageY-pos.y};
	}
	else{
	    return {x:0, y:0};
	}
    }
};


// ---------------------------------------------------------------------------
// Maze
// ---------------------------------------------------------------------------

var Cell = {
    OUTSIDE: 0,
    FLOOR: 1,
    WALL: 2,
    GOAL: 3
};

function Maze(cells, player, boxes)
{
    this.cells = cells;
    if(player){
	this.player = new Player(player.x, player.y);
    }
    else{
	this.player = null;
    }
    this.boxes = new Array(boxes.length);
    for(var bi = 0; bi < boxes.length; ++bi){
	this.boxes[bi] = new Box(boxes[bi].x, boxes[bi].y);
    }

    this.width = MazeUtil.maxElement(cells, function(lhs, rhs){return lhs.length < rhs.length;}).length;
    this.height = cells.length;
}
Maze.prototype = {
    cellAt: function(x, y)
    {
	return (y >= 0 && y < this.cells.length && x >= 0 && x < this.cells[y].length)
	    ? this.cells[y][x] : Cell.OUTSIDE;
    },

    cellIsEmpty: function(x, y)
    {
	var c = this.cellAt(x, y);
	return c == Cell.FLOOR || c == Cell.GOAL;
    },

    findBox: function(x, y)
    {
	for(var bi = 0; bi < this.boxes.length; ++bi){
	    if(this.boxes[bi].x == x && this.boxes[bi].y == y){
		return this.boxes[bi];
	    }
	}
	return null;
    },

    advanceTime: function(dt)
    {
	if(this.player){
	    this.player.advanceTime(dt);
	}
	for(var bi = 0; bi < this.boxes.length; ++bi){
	    this.boxes[bi].advanceTime(dt);
	}
    },

    hasMovingObject: function()
    {
	if(this.player && !this.player.isWaiting()){
	    return true;
	}
	for(var bi = 0; bi < this.boxes.length; ++bi){
	    if(!this.boxes[bi].isWaiting()){
		return true;
	    }
	}
	return false;
    },

    isAllBoxesOnGoal: function()
    {
	for(var bi = 0; bi < this.boxes.length; ++bi){
	    var x = this.boxes[bi].x;
	    var y = this.boxes[bi].y;
	    if(x != Math.floor(x) || y != Math.floor(y)){
		return false;
	    }
	    if(this.cellAt(x, y) != Cell.GOAL){
		return false;
	    }
	}
	return true;
    }
};


function loadMaze(strs)
{
    var assert = function(cond) { if(!cond){ throw "Failed to load maze.";}};
    var player = null;
    var cells = [];
    var boxes = new Array();

    for(var y = 0; y < strs.length; ++y){

	var cellsRow = [];

	for(var x = 0; x < strs[y].length; ++x){ // for/inではダメだった。Firefoxは動いたけど。
	    switch(strs[y].charAt(x)){ //strs[y][x]と書いたらIEで動かなかった。
	    case '#': cellsRow.push(Cell.WALL); break;
	    case '@': cellsRow.push(Cell.FLOOR); assert(!player); player = {x:x, y:y}; break;
	    case ' ': cellsRow.push(Cell.FLOOR); break;
	    case 'B': cellsRow.push(Cell.FLOOR); boxes.push({x:x, y:y}); break;
	    case 'O': cellsRow.push(Cell.GOAL); break;
	    default: cellsRow.push(Cell.OUTSIDE); break;
	    }
	}

	cells.push(cellsRow);
    }

    return new Maze(cells, player, boxes);
}


function toMazeString(mazeModel)
{
    var str = "";

    for(var y = 0; y < mazeModel.cells.length; ++y){
	var line = "";
	for(var x = 0; x < mazeModel.cells[y].length; ++x){
	    var existsPlayer
		= (mazeModel.player && mazeModel.player.x == x && mazeModel.player.y == y);
	    var existsBox
		= mazeModel.findBox(x, y);

	    if(existsPlayer){
		line += '@';
	    }
	    else if(existsBox){
		line += 'B';
	    }
	    else{
		switch(mazeModel.cells[y][x]){
		case Cell.OUTSIDE: line += '.'; break;
		case Cell.FLOOR: line += ' '; break;
		case Cell.WALL: line += '#'; break;
		case Cell.GOAL: line += 'O'; break;
		}
	    }
	}
	str = str + line + "\n";
    }
    return str;
}

function outputMazeText(mazeModel)
{
    document.open();
    document.write("<pre>");
    document.write(toMazeString(mazeModel));
    document.write("</pre>");
    document.close();
}


// ---------------------------------------------------------------------------
// GameObject
// ---------------------------------------------------------------------------

function GameObject()
{
    this.initGameObject.apply(this, arguments);
}
GameObject.prototype = {
    initGameObject: function(x, y)
    {
	this.x = x;
	this.y = y;
	this.state = null;
	this.age = 0;
    },

    advanceTime: function(dt)
    {
	this.age += dt;
	if(this.state){
	    this.state.advanceTime(dt);
	}
    },

    isWaiting: function()
    {
	return !this.state;
    },

    moveTo: function(x, y, dur)
    {
	this.state = {
	    obj: this,
	    beginX: this.x,
	    beginY: this.y,
	    endX: x,
	    endY: y,
	    beginTime: this.age,
	    dur: dur,

	    advanceTime: function(dt)
	    {
		var t = (this.obj.age - this.beginTime) / this.dur;
		if(t >= 1.0){
		    this.obj.x = this.endX;
		    this.obj.y = this.endY;
		    this.obj.state = null;
		}
		else{
		    this.obj.x = t * (this.endX - this.beginX) + this.beginX;
		    this.obj.y = t * (this.endY - this.beginY) + this.beginY;
		}
	    }
	    
	};
    }
};




// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

function Player(x, y)
{
    this.initGameObject(x, y);
    this.dirX = 0;
    this.dirY = 1;
}
Player.prototype = GameObject.prototype;


// ---------------------------------------------------------------------------
// Box
// ---------------------------------------------------------------------------

function Box(x, y)
{
    this.initGameObject(x, y);
}
Box.prototype = GameObject.prototype;






// ---------------------------------------------------------------------------
// 描画関連
// ---------------------------------------------------------------------------

function defineImageSet()
{
    // 読み込む画像を定義する。
    var imgdir = "img";
    var imgs = new ImageSet();
    imgs.imMazeWall = imgs.addImage(imgdir+"/brick.png");
    imgs.imMazeFloor = imgs.addImage(imgdir+"/oak.png");
    imgs.imMazeGoal = imgs.addImage(imgdir+"/goal.png");
    imgs.imBoxSide = imgs.addImage(imgdir+"/box_side.png");

    imgs.imPlayerStand = new Array();
    imgs.imPlayerWalk = new Array();
    for(var dir = 0; dir < 4; ++dir){
	var dirstr
	    = (dir == 0) ? "right"
	    : (dir == 1) ? "front"
	    : (dir == 2) ? "left"
	    : "back";
	imgs.imPlayerStand[dir] = new Array();
	imgs.imPlayerStand[dir][0] = imgs.addImage(imgdir+"/obj_man_" + dirstr + "_s0.png");
	imgs.imPlayerWalk[dir] = new Array();
	for(var pat = 0; pat < 8; ++pat){
	    imgs.imPlayerWalk[dir][pat] = imgs.addImage(imgdir+"/obj_man_" + dirstr + "_w" + pat + ".png");
	}
    }
    return imgs;
}

function MazeShape(maze, imgs)
{
    var WALL_HEIGHT = 1.0;

    this.vertices = new Array();
    this.transformed = new Array();
    this.surfaces = new Array();

    var imWall = imgs.imMazeWall;
    var imFloor = imgs.imMazeFloor;
    var imGoal = imgs.imMazeGoal;

    var points = {
	getIndex: function(x, y, z, ver)
	{
	    var key = "pt " + x + "," + y + "," + z;
	    var idx = this[key];
	    if(!idx){
		idx = ver.length / 3;
		this[key] = idx;
		ver.push(x, y, z);
	    }
	    return idx;
	}
    };

    var idx10;
    var idx11;
    var idx12;
    var idx13;
    var idx00;
    var idx01;
    var idx02;
    var idx03;
    for(var y = 0; y < maze.height; ++y){

	for(var x = 0; x < maze.width; ++x){
	    switch(maze.cellAt(x, y)){
	    case Cell.WALL:
		idx10 = points.getIndex(x, WALL_HEIGHT, -y, this.vertices);
		idx11 = points.getIndex(x, WALL_HEIGHT, -y-1, this.vertices);
		idx12 = points.getIndex(x+1, WALL_HEIGHT, -y-1, this.vertices);
		idx13 = points.getIndex(x+1, WALL_HEIGHT, -y, this.vertices);
		idx00 = points.getIndex(x, 0, -y, this.vertices);
		idx01 = points.getIndex(x, 0, -y-1, this.vertices);
		idx02 = points.getIndex(x+1, 0, -y-1, this.vertices);
		idx03 = points.getIndex(x+1, 0, -y, this.vertices);

		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx10, idx11, idx12, idx13],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		if(maze.cellAt(x-1, y) != Cell.WALL){
		    this.surfaces.push(new Surface(
			this.transformed,
			[idx10, idx00, idx01, idx11],
			[0,0, 0,1, 1,1, 1,0],
			imWall, "#000"));
		}
		if(maze.cellAt(x, y+1) != Cell.WALL){
		    this.surfaces.push(new Surface(
			this.transformed,
			[idx11, idx01, idx02, idx12],
			[0,0, 0,1, 1,1, 1,0],
			imWall, "#000"));
		}
		if(maze.cellAt(x+1, y) != Cell.WALL){
		    this.surfaces.push(new Surface(
			this.transformed,
			[idx12, idx02, idx03, idx13],
			[0,0, 0,1, 1,1, 1,0],
			imWall, "#000"));
		}
		if(maze.cellAt(x, y-1) != Cell.WALL){
		    this.surfaces.push(new Surface(
			this.transformed,
			[idx13, idx03, idx00, idx10],
			[0,0, 0,1, 1,1, 1,0],
			imWall, "#000"));
		}
		break;
	    case Cell.FLOOR:
		idx00 = points.getIndex(x, 0, -y, this.vertices);
		idx01 = points.getIndex(x, 0, -y-1, this.vertices);
		idx02 = points.getIndex(x+1, 0, -y-1, this.vertices);
		idx03 = points.getIndex(x+1, 0, -y, this.vertices);
		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx00, idx01, idx02, idx03],
		    [0,0, 0,1, 1,1, 1,0],
		    imFloor, "#000"));
		break;
	    case Cell.GOAL:
		idx00 = points.getIndex(x, 0, -y, this.vertices);
		idx01 = points.getIndex(x, 0, -y-1, this.vertices);
		idx02 = points.getIndex(x+1, 0, -y-1, this.vertices);
		idx03 = points.getIndex(x+1, 0, -y, this.vertices);
		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx00, idx01, idx02, idx03],
		    [0,0, 0,1, 1,1, 1,0],
		    imGoal, "#000"));
		break;
	    }
        }
    }
}

function PlayerShape(maze, matView, imgs)
{
    this.vertices = new Array();
    this.transformed = new Array();
    this.surfaces = new Array();

    if(!maze.player){
	return;
    }

    var cx = maze.player.x + 0.5;
    var cy = maze.player.y + 0.5;
    this.matWorld = new Mat44(
	matView[0], matView[4], matView[8], 0,
	matView[1], matView[5], matView[9], 0,
	matView[2], matView[6], matView[10], 0,
	cx, 0, -cy, 1);

    var PLAYER_HEIGHT = 1.5;
    var PLAYER_Z_DELTA = -0.5;
    this.vertices.push(-0.5, PLAYER_HEIGHT, PLAYER_Z_DELTA);
    this.vertices.push(-0.5, 0, PLAYER_Z_DELTA);
    this.vertices.push(0.5, 0, PLAYER_Z_DELTA);
    this.vertices.push(0.5, PLAYER_HEIGHT, PLAYER_Z_DELTA);

    // カメラから見えるプレイヤーの方向を計算する。
    var viewDirX = matView[2];
    var viewDirY = -matView[10];
    var viewDirLen = Math.sqrt(viewDirX*viewDirX + viewDirY*viewDirY);
    viewDirX /= viewDirLen;
    viewDirY /= viewDirLen;

    var dirY = -viewDirX * maze.player.dirX + -viewDirY * maze.player.dirY;
    var dirX = -viewDirY * maze.player.dirX + viewDirX * maze.player.dirY;
    var dir
	= Math.abs(dirX) > Math.abs(dirY)
	? (dirX > 0) ? 0 : 2
        : (dirY > 0) ? 1 : 3;

    var im = null;
    if(maze.player.isWaiting()){
	im = imgs.imPlayerStand[dir][0];
    }
    else{
	var step = Math.floor(maze.player.age / 500 % 1 * imgs.imPlayerWalk[0].length);
	im = imgs.imPlayerWalk[dir][step];
    }

    this.surfaces.push(new Surface(
	this.transformed,
	[0, 1, 2, 3],
	[0,0, 0,1, 1,1, 1,0],
	im, null));
}

function BoxShape(box, imgs)
{
    var x = box.x;
    var y = box.y;
    var imBox = imgs.imBoxSide;

    this.vertices = new Array();
    this.transformed = new Array();
    this.surfaces = new Array();

    var BOX_HEIGHT = 1.0;
    var MARGIN = 0.1;
    var idx = 0;
    this.vertices.push(x+MARGIN, BOX_HEIGHT, -y-MARGIN);
    this.vertices.push(x+MARGIN, BOX_HEIGHT, -y-1+MARGIN);
    this.vertices.push(x+1-MARGIN, BOX_HEIGHT, -y-1+MARGIN);
    this.vertices.push(x+1-MARGIN, BOX_HEIGHT, -y-MARGIN);
    this.vertices.push(x+MARGIN, 0, -y-MARGIN);
    this.vertices.push(x+MARGIN, 0, -y-1+MARGIN);
    this.vertices.push(x+1-MARGIN, 0, -y-1+MARGIN);
    this.vertices.push(x+1-MARGIN, 0, -y-MARGIN);

    this.surfaces.push(new Surface(
	this.transformed,
	[idx+0, idx+1, idx+2, idx+3],
	[0,0, 0,1, 1,1, 1,0],
	imBox, "#000"));
    this.surfaces.push(new Surface(
	this.transformed,
	[idx+0, idx+4, idx+5, idx+1],
	[0,0, 0,1, 1,1, 1,0],
	imBox, "#000"));
    this.surfaces.push(new Surface(
	this.transformed,
	[idx+1, idx+5, idx+6, idx+2],
	[0,0, 0,1, 1,1, 1,0],
	imBox, "#000"));
    this.surfaces.push(new Surface(
	this.transformed,
	[idx+2, idx+6, idx+7, idx+3],
	[0,0, 0,1, 1,1, 1,0],
	imBox, "#000"));
    this.surfaces.push(new Surface(
	this.transformed,
	[idx+3, idx+7, idx+4, idx+0],
	[0,0, 0,1, 1,1, 1,0],
	imBox, "#000"));
}

function transformShape(frontFaces, shape, mat)
{
    if(shape.matWorld){
	var m = new Mat44();
	m.mul(shape.matWorld, mat);
	mat = m;
    }

    // Transform Vertices.
    var vcount = shape.vertices.length / 3;
    var src = new Vec3();
    var dst = new Vec3();
    for(var vi = 0; vi < vcount; ++vi){
	src.set(shape.vertices[vi*3+0], shape.vertices[vi*3+1], shape.vertices[vi*3+2]);
	dst.mul(src, mat);
	shape.transformed[vi*3+0] = dst[0];
	shape.transformed[vi*3+1] = dst[1];
	shape.transformed[vi*3+2] = dst[2];
    }

    // Cull backfacing surfaces.
    for(var si = 0; si < shape.surfaces.length; ++si){
	if(shape.surfaces[si].isFrontFace()){
	    frontFaces.push(shape.surfaces[si]);
	}
    }
}




function drawMaze(canvas, maze, mazeShape, cameraAngle)
{
    if(!canvas || !canvas.getContext){
	return;
    }
    var ctx = canvas.getContext("2d");

    // Create Transform Matrix
    var centerX = maze.width/2;
    var centerY = maze.height/2;
    var eyeX = centerX + Math.cos(cameraAngle) * 20;
    var eyeY = centerY + Math.sin(cameraAngle) * 20;

    var cameraWidth = 0;
    var cameraHeight = 0;
    if(canvas.width / maze.width < canvas.height / maze.height){
	cameraWidth = maze.width;
	cameraHeight = cameraWidth * canvas.height / canvas.width;
    }
    else{
	cameraHeight = maze.height;
	cameraWidth = cameraHeight * canvas.width / canvas.height;
    }
    var matView = Mat44.newLookAtLH(new Vec3(eyeX,30,-eyeY), new Vec3(centerX,0,-centerY), new Vec3(0,1,0));

    var matProj = new Mat44(
	2/cameraWidth,0,0,0,
	0,2/cameraHeight,0,0,
	0,0,1,0,
	0,0,0,1
    );
    var matScreen = new Mat44(
	canvas.width/2,0,0,0,
	0,-canvas.height/2,0,0,
	0,0,1,0,
	canvas.width/2,canvas.height/2,0,1);
    var mat = new Mat44();
    mat.mul(matView, matProj);
    mat.mul(mat, matScreen);

    // Create Transformed Surfaces.
    var frontFaces = new Array();
    transformShape(frontFaces, mazeShape, mat);
    var playerShape = new PlayerShape(maze, matView, sokobanImageSet);
    transformShape(frontFaces, playerShape, mat);
    for(var bi = 0; bi < maze.boxes.length; ++bi){
	var boxShape = new BoxShape(maze.boxes[bi], sokobanImageSet);
	transformShape(frontFaces, boxShape, mat);
    }


    // Sort surfaces by z.
    frontFaces.sort(function(lhs, rhs) { return rhs.getMostFrontZ() - lhs.getMostFrontZ();});

    // Draw surfaces.
    ctx.fillStyle = "#cca";
    ctx.fillRect(0,0,640,480);
    for(var si = 0; si < frontFaces.length; ++si){
	drawSurface(ctx, frontFaces[si]);
    }
}





// ---------------------------------------------------------------------------
// エディタ
// ---------------------------------------------------------------------------

function SokobanEditor(mazeData, keyelem, canvas)
{
    this.game = new SokobanGame(mazeData, keyelem, canvas);

    this.timerRotation = null;
}
mypkg.SokobanEditor = SokobanEditor;
SokobanEditor.prototype = {
    updateMazeModel: function(arrayLines)
    {
	this.game.stopGame();
	this.game.setMazeData(arrayLines);
    },

    startRotation: function()
    {
	if(this.timerRotation){
	    return;
	}
	var editor = this;
	var onTime = function()
	{
	    editor.game.cameraAngle += Math.PI/180*5;
	    editor.game.redraw();
	};
	this.timerRotation = setInterval(onTime, 100);
    },

    stopRotation: function()
    {
	if(!this.timerRotation){
	    return;
	}
	clearInterval(this.timerRotation);
	this.timerRotation = null;
    },

    startGame: function()
    {
	this.game.startGame();
    }
};







// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var sokobanImageSet = null;

function SokobanGame(mazeData, keyelem, canvas)
{
    var game = this;

    this.canvas = canvas;
    this.keyelem = keyelem;
    this.timerFrame = null;

    if(mazeData){
	this.maze = loadMaze(mazeData);
    }

    this.cameraAngle = Math.PI*0.4;

    this.gameStarting = false;
    this.gameStarted = false;

    // 画像の読み込みを開始する。
    if(!sokobanImageSet){
	sokobanImageSet = defineImageSet();
    }
    if(!sokobanImageSet.isComplete()){
	sokobanImageSet.addEventListener(
	    "onprogress",
	    function(imgs){ drawImageLoadProgressBar(imgs, canvas);});
	sokobanImageSet.addEventListener(
	    "oncomplete",
	    function(){ game.updateMazeShape();});
    }
    else{
	game.updateMazeShape();
    }
}
SokobanGame.prototype = {
    setMazeData: function(arrayLines)
    {
	this.maze = loadMaze(arrayLines);

	//outputMazeText(this.maze); return;
	this.updateMazeShape();
    },

    updateMazeShape: function()
    {
	if(this.maze && sokobanImageSet && sokobanImageSet.isComplete()){
	    this.mazeShape = new MazeShape(this.maze, sokobanImageSet); //imagesが必要
	    this.redraw();
	    if(this.gameStarting){
		this.startGame();
	    }
	}
    },

    startGame: function()
    {
	if(this.gameStarted){
	    return;
	}

	this.gameStarting = true;
	if(!this.maze || !this.mazeShape){
	    return;
	}
	this.gameStarting = false;

	this.gameStarted = true;
	this.completed = false;

	//this.cameraAngle = Math.PI*0.4;
	//this.redraw();

	this.startKeyListening();
	this.startMouseListening();
    },

    stopGame: function()
    {
	if(!this.gameStarted){
	    return;
	}
	this.stopMouseListening();
	this.stopKeyListening();
	this.stopTimer();
	this.gameStarted = false;
    },

    redraw: function()
    {
	if(this.canvas && this.maze && this.mazeShape && this.cameraAngle){
	    drawMaze(this.canvas, this.maze, this.mazeShape, this.cameraAngle);
	}
    },


    // 時間進行

    startTimer: function()
    {
	if(!this.timerFrame){
	    var game = this;
	    var dt = 100;
	    this.timerFrame = setInterval(function(){game.advanceTime(dt);}, dt);
	}
    },

    stopTimer: function()
    {
	if(this.timerFrame){
	    clearInterval(this.timerFrame);
	    this.timerFrame = null;
	}
    },

    advanceTime: function(dt)
    {
	this.maze.advanceTime(dt);

	if(!this.completed && this.maze.player && this.maze.player.isWaiting() && this.maze.isAllBoxesOnGoal()){
	    alert("Complete!!");
	    this.completed = true;
	}


	this.movePlayerByArrowKey();
	this.movePlayerByMouse();

	this.redraw();

	this.updateTimerState();
    },

    updateTimerState: function()
    {
	if(this.maze.hasMovingObject()){
	    this.startTimer();
	}
	else{
	    this.stopTimer();
	}
    },

    // マウス入力
    startMouseListening: function()
    {
	this.pressedMousePos = null;

	var game = this;
	this.canvas.onmousedown = function(ev){ game.onMouseDown(ev);};
	this.canvas.onmouseup = function(ev){ game.onMouseUp(ev);};
	this.canvas.onmouseout = function(ev){ game.onMouseOut(ev);};
	this.canvas.onclick = function(ev){ game.onClick(ev);};
    },

    stopMouseListening: function()
    {
	this.canvas.onmousedown = null;
	this.canvas.onmouseup = null;
	this.canvas.onmouseout = null;
	this.canvas.onclick = null;
    },

    onMouseDown: function(ev)
    {
	var pos = MazeUtil.getMousePosOnElement(this.canvas, ev);
	this.setPressedMousePos(pos);
    },

    onMouseUp: function(ev)
    {
	this.resetPressedMousePos();
    },

    onMouseOut: function(ev)
    {
	this.resetPressedMousePos();
    },

    onClick: function(ev)
    {
	if(this.keyelem){
	    this.keyelem.focus();
	}

//	var pos = MazeUtil.getMousePosOnElement(this.canvas, ev);
//	this.setPressedMousePos(pos);
//	this.resetPressedMousePos();
    },

    setPressedMousePos: function(pos)
    {
	this.pressedMousePos = pos;
	this.movePlayerByMouse();
    },

    resetPressedMousePos: function()
    {
	this.pressedMousePos = null;
    },

    movePlayerByMouse: function()
    {
	if(!this.pressedMousePos){
	    return;
	}

	var dirX
	    = this.pressedMousePos.x < this.canvas.width/3 ? -1
	    : this.pressedMousePos.x > this.canvas.width*2/3 ? 1
	    : 0;
	var dirY
	    = this.pressedMousePos.y < this.canvas.height/3 ? -1
	    : this.pressedMousePos.y > this.canvas.height*2/3 ? 1
	    : 0;

	this.movePlayerByDir(dirX, dirY);
    },

    // キー入力

    startKeyListening: function()
    {
	this.pressedArrowKeyBits = 0;

	var game = this;
	if(game.keyelem){
	    game.keyelem.onkeydown = function(ev) { game.onKeyDown(ev ? ev.keyCode : event.keyCode);};
	    game.keyelem.onkeyup = function(ev) { game.onKeyUp(ev ? ev.keyCode : event.keyCode);};
	    game.keyelem.onblur = function() { game.onBlur();};
	    game.keyelem.focus();
	}
    },

    stopKeyListening: function()
    {
	this.keyelem.onkeydown = null;
	this.keyelem.onkeyup = null;
	this.keyelem.onkeyblur = null;
    },

    onKeyDown: function(keycode)
    {
	//left 37
	//up 38
	//right 39
	//down 40
	switch(keycode){
	case 37: this.setArrowKeyBits(4); break;
	case 38: this.setArrowKeyBits(8); break;
	case 39: this.setArrowKeyBits(1); break;
	case 40: this.setArrowKeyBits(2); break;
	}
    },

    onKeyUp: function(keycode)
    {
	switch(keycode){
	case 37: this.resetArrowKeyBits(4); break;
	case 38: this.resetArrowKeyBits(8); break;
	case 39: this.resetArrowKeyBits(1); break;
	case 40: this.resetArrowKeyBits(2); break;
	}
    },

    onBlur: function()
    {
	this.resetArrowKeyBits(15);
    },

    setArrowKeyBits: function(bits)
    {
	this.pressedArrowKeyBits |= bits;
	this.movePlayerByArrowKey();
    },

    resetArrowKeyBits: function(bits)
    {
	this.pressedArrowKeyBits &= ~bits;
	this.movePlayerByArrowKey();
    },

    movePlayerByArrowKey: function()
    {
	var dirX
	    = ((this.pressedArrowKeyBits & 1) ? 1 : 0)
	    + ((this.pressedArrowKeyBits & 4) ? -1 : 0);
	var dirY
	    = ((this.pressedArrowKeyBits & 2) ? 1 : 0)
	    + ((this.pressedArrowKeyBits & 8) ? -1 : 0);

	this.movePlayerByDir(dirX, dirY);
    },


    movePlayerByDir: function(dirX, dirY)
    {
	if(!this.maze.player){
	    return; //no player exists.
	}
	if(!this.maze.player.isWaiting()){
	    return; // player is moving.
	}
	if(!dirX && !dirY){
	    return;
	}

	if(dirX && dirY){
	    var ableX = this.maze.cellIsEmpty(this.maze.player.x + dirX, this.maze.player.y);
	    var ableY = this.maze.cellIsEmpty(this.maze.player.x, this.maze.player.y + dirY);
	    if(ableX && ableY){
		return;
	    }

	    if(!ableY){
		dirY = 0;
	    }
	    else{
		dirX = 0;
	    }
	}

	this.movePlayer(dirX, dirY);
    },

    movePlayer: function(dirX, dirY)
    {
	if(!this.maze.player || !this.maze.player.isWaiting()){
	    return;
	}

	var destX = this.maze.player.x + dirX;
	var destY = this.maze.player.y + dirY;

	if(!this.maze.cellIsEmpty(destX, destY)){
	    return;
	}

	var box = this.maze.findBox(destX, destY);

	if(box && (!this.maze.cellIsEmpty(destX+dirX, destY+dirY) || this.maze.findBox(destX+dirX, destY+dirY))){
	    return;
	}

	var PLAYER_DUR_PER_CELL = 400;

	this.maze.player.moveTo(destX, destY, PLAYER_DUR_PER_CELL);
	this.maze.player.dirX = dirX;
	this.maze.player.dirY = dirY;
	if(box){
	    box.moveTo(destX+dirX, destY+dirY, PLAYER_DUR_PER_CELL);
	}
	this.updateTimerState();
    }
};


function getLastScriptNode()
{
    var n = document;
    while(n && n.nodeName.toLowerCase() != "script") { n = n.lastChild;}
    return n;
}

function createSokobanElement(mazeData, keyelem)
{
    var div = document.createElement("div");

    var cv = document.createElement("canvas");
    cv.setAttribute("width", 480);
    cv.setAttribute("height", 360);
    //cv.setAttribute("tabindex", 0);
    div.appendChild(cv);

    if(typeof G_vmlCanvasManager !== "undefined"){ //for IE
	cv = G_vmlCanvasManager.initElement(cv);
    }


    if(!keyelem){
	var text = document.createElement("textarea");
	text.setAttribute("cols", "1");
	text.setAttribute("rows", "1");
	div.appendChild(text);
	keyelem = text;
    }

    var buttonRestart = document.createElement("input");
    buttonRestart.setAttribute("type", "button");
    buttonRestart.setAttribute("value", "Restart");
    div.appendChild(buttonRestart);

    var game = new SokobanGame(mazeData, keyelem, cv);
    div.game = game;

    buttonRestart.onclick = function()
    {
	game.stopGame();
	game.setMazeData(mazeData);
	game.startGame();
    };

    return div;
}



function SokobanPreview_OnClick(mazeData, pre)
{
    var gameElem = createSokobanElement(mazeData, null);

    var buttonClose = document.createElement("input");
    buttonClose.setAttribute("type", "button");
    buttonClose.setAttribute("value", "Close");
    gameElem.appendChild(buttonClose);
    buttonClose.onclick = function(){
	gameElem.game.stopGame();
	gameElem.parentNode.replaceChild(pre, gameElem);
    };

    pre.parentNode.replaceChild(gameElem, pre);

    gameElem.game.startGame();
}

/**
 * <script type="text/javascript">placeSokobanElement(["###","#@#","###"]);</script>のように使います。
 */
function placeSokobanPreview(mazeData, imgPreview)
{
    var pre;
    if(imgPreview){
	pre = document.createElement("img");
	pre.src = imgPreview;
    }
    else{
	pre = document.createElement("pre");
	pre.appendChild(document.createTextNode(toMazeString(loadMaze(mazeData))));
	pre.style.cssText = "border: 1px solid black; display: inline-block;";
    }

    getLastScriptNode().parentNode.appendChild(pre);

    pre.onclick = function() { SokobanPreview_OnClick(mazeData, pre);};
}

/**
 * <script type="text/javascript">placeSokobanElement(["###","#@#","###"]);</script>のように使います。
 */
function placeSokobanElement(mazeData)
{
    var gameElem = createSokobanElement(mazeData, window);
    var parent = getLastScriptNode().parentNode;
    parent.appendChild(gameElem);
    gameElem.game.startGame();
}
mypkg.placeSokobanElement = placeSokobanElement;

/**
 * <pre onclick="playSokobanOnPreElement(this);">面データ</pre>のように使います。
 */
function playSokobanOnPreElement(elem)
{
    var pre = elem;
    var mazeData = MazeUtil.splitLines(elem.firstChild.nodeValue);
    if(mazeData[0].length == 0){
	mazeData.shift();
    }

    SokobanPreview_OnClick(mazeData, pre);
}
mypkg.playSokobanOnPreElement = playSokobanOnPreElement;


})(this);
