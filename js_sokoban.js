// Title: JavaScript Puzzle Game Warehouse keeper
// Author: AKIYAMA Kouhei
// Since: 2009


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
}
ImageSet.prototype = {
    addImage: function(src)
    {
	var im = new Image();
	var th = this;
	im.onload = function(){ th.onLoadImage();}
	im.src = src;
	++this.imageCountTotal;
	return im;
    },
    onLoadImage: function()
    {
	++this.imageCountLoaded;
	if(this.onProgress){
	    this.onProgress(this);
	}
	if(this.isComplete()){
	    if(this.onComplete){
		this.onComplete(this);
	    }
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
}

/**
 * 画像の読み込み状況をcanvas要素へ描画します。
 * ImageSetのonProgressへ設定して使います。
 */
function drawImageLoadProgressBar(imgs, canvas)
{
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

MazeUtil = {
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
	for(var i = 0; i < str.length; ++i){
	    var ch = str.charAt(i);
	    if(ch == '\n'){
		lines.push("");
	    }
	    else{
		lines[lines.length-1] += ch;
	    }
	}
	return lines;
    }

};


// ---------------------------------------------------------------------------
// Maze
// ---------------------------------------------------------------------------

Cell = {
    OUTSIDE: 0,
    FLOOR: 1,
    WALL: 2,
    GOAL: 3
};

function Maze(cells, player, boxes)
{
    this.cells = cells;
    this.player = new Player(player.x, player.y);
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
    },
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


function outputMazeText(maze)
{
    document.open();
    document.write("<pre>");

    for(var y in maze.cells){
	var line = "";
	for(var x in maze.cells[y]){
	    switch(maze.cells[y][x]){
	    case Cell.OUTSIDE: line += '.'; break;
	    case Cell.FLOOR: line += ' '; break;
	    case Cell.WALL: line += '#'; break;
	    }
	}
	document.writeln(line);
    }
    document.writeln("player:(" + maze.player.x + "," + maze.player.y + ")");

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
	    
	}
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
    var imgs = new ImageSet();
    imgs.imMazeWall = imgs.addImage("img/brick.png");
    imgs.imMazeFloor = imgs.addImage("img/oak.png");
    imgs.imMazeGoal = imgs.addImage("img/goal.png");
    imgs.imBoxSide = imgs.addImage("img/box_side.png");

    imgs.imPlayerStand = new Array();
    imgs.imPlayerWalk = new Array();
    for(var dir = 0; dir < 4; ++dir){
	var dirstr
	    = (dir == 0) ? "right"
	    : (dir == 1) ? "front"
	    : (dir == 2) ? "left"
	    : "back";
	imgs.imPlayerStand[dir] = new Array();
	imgs.imPlayerStand[dir][0] = imgs.addImage("img/obj_man_" + dirstr + "_s0.png");
	imgs.imPlayerWalk[dir] = new Array();
	for(var pat = 0; pat < 8; ++pat){
	    imgs.imPlayerWalk[dir][pat] = imgs.addImage("img/obj_man_" + dirstr + "_w" + pat + ".png");
	}
    }
    return imgs;
}

function MazeShape(maze)
{
    var WALL_HEIGHT = 1.0;

    this.vertices = new Array();
    this.transformed = new Array();
    this.surfaces = new Array();

    var imWall = images.imMazeWall;
    var imFloor = images.imMazeFloor;
    var imGoal = images.imMazeGoal;

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

function PlayerShape(maze, matView)
{
    this.vertices = new Array();
    this.transformed = new Array();
    this.surfaces = new Array();

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
	im = images.imPlayerStand[dir][0];
    }
    else{
	var step = Math.floor(maze.player.age / 500 % 1 * images.imPlayerWalk[0].length);
	im = images.imPlayerWalk[dir][step];
    }

    this.surfaces.push(new Surface(
	this.transformed,
	[0, 1, 2, 3],
	[0,0, 0,1, 1,1, 1,0],
	im, null));
}

function BoxShape(box)
{
    var x = box.x;
    var y = box.y;
    var imBox = images.imBoxSide;

    this.vertices = new Array();
    this.transformed = new Array();
    this.surfaces = new Array();

    var BOX_HEIGHT = 1.0;
    var MARGIN = 0.1;
    idx = 0;
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
    var ctx = canvas.getContext("2d");

    // Create Transform Matrix
    var centerX = maze.width/2;
    var centerY = maze.height/2;
    var eyeX = centerX + Math.cos(cameraAngle) * 20;
    var eyeY = centerY + Math.sin(cameraAngle) * 20;

    var widthCells = maze.width;
    var matView = Mat44.newLookAtLH(new Vec3(eyeX,30,-eyeY), new Vec3(centerX,0,-centerY), new Vec3(0,1,0));

    var matProj = new Mat44(
	2/widthCells,0,0,0,
	0,2/(widthCells*canvas.height/canvas.width),0,0,
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
    var playerShape = new PlayerShape(maze, matView);
    transformShape(frontFaces, playerShape, mat);
    for(var bi = 0; bi < maze.boxes.length; ++bi){
	var boxShape = new BoxShape(maze.boxes[bi]);
	transformShape(frontFaces, boxShape, mat)
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

function Editor(mazeData, keyelem, canvas)
{
    this.game = new Game(mazeData, keyelem, canvas);

    this.timerRotation = null;
}
Editor.prototype = {
    updateMazeModel: function(arrayLines)
    {
	this.game.maze = loadMaze(arrayLines);
	//outputMazeText(maze); return;

	this.game.mazeShape = new MazeShape(this.game.maze);

	drawMaze(this.game.canvas, this.game.maze, this.game.mazeShape, this.game.cameraAngle);
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
	    drawMaze(this.game.canvas, editor.game.maze, editor.game.mazeShape, editor.game.cameraAngle);
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
    }
};




var dataMazeTest =
["...#####.......",
 "...#   #.......",
 ".### B #######.",
 ".# @     B   #.",
 ".## ## #   ###.",
 "..#        #...",
 "..# ####   #...",
 "..#O      O#...",
 "..##########..."];


function initEditor(mazeData)
{
    editor = new Editor(mazeData);
}




// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

function Game(mazeData, keyelem, canvas)
{
    var game = this;

    this.canvas = canvas;
    this.keyelem = keyelem;
    this.timerFrame = null;
    this.gameTime = 0;
    this.pressedArrowKeyBits = 0;
    this.pressedArrowKeyLast = 0;
    this.completed = false;

    this.cameraAngle = Math.PI*0.4;
    this.maze = loadMaze(mazeData);
    this.mazeShape = null;

    images = defineImageSet();
    images.onProgress = function(imgs){ drawImageLoadProgressBar(imgs, canvas)};
    images.onComplete = function(){ game.startGame();};
}
Game.prototype = {
    startGame: function()
    {
	this.mazeShape = new MazeShape(this.maze); //imagesが必要
	drawMaze(this.canvas, this.maze, this.mazeShape, this.cameraAngle);

	var game = this;
	game.keyelem.onkeydown = function(ev) { game.onKeyDown(ev.keyCode);}
	game.keyelem.onkeyup = function(ev) { game.onKeyUp(ev.keyCode);}
	game.keyelem.onblur = function() { game.onBlur();}
    },


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
	this.gameTime += dt;

	this.maze.advanceTime(dt);

	if(!this.completed && this.maze.player.isWaiting() && this.maze.isAllBoxesOnGoal()){
	    alert("Complete!!");
	    this.completed = true;
	}


	this.movePlayerByArrowKey();

	drawMaze(this.canvas, this.maze, this.mazeShape, this.cameraAngle);

	this.updateTimerState();
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
	this.pressedArrowKeyLast = bits;
	this.movePlayerByArrowKey();
    },

    resetArrowKeyBits: function(bits)
    {
	this.pressedArrowKeyBits &= ~bits;
	this.movePlayerByArrowKey();
    },

    movePlayerByArrowKey: function()
    {
	if(!this.maze.player){
	    return; //no player exists.
	}
	else if(!this.maze.player.isWaiting()){
	    return; // player is moving.
	}
	var dirX
	    = ((this.pressedArrowKeyBits & 1) ? 1 : 0)
	    + ((this.pressedArrowKeyBits & 4) ? -1 : 0);
	var dirY
	    = ((this.pressedArrowKeyBits & 2) ? 1 : 0)
	    + ((this.pressedArrowKeyBits & 8) ? -1 : 0);

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
    },

    updateTimerState: function()
    {
	if(this.maze.hasMovingObject()){
	    this.startTimer();
	}
	else{
	    this.stopTimer();
	}
    }
};

function initGame(mazeData)
{
    var cv = document.getElementById("canvas");
    game = new Game(mazeData, window, cv);
}

function initGameOnElement(elem, keyelem, mazeData)
{
    var cv = document.createElement("canvas");
    cv.setAttribute("width", 480);
    cv.setAttribute("height", 360);
    elem.parentNode.replaceChild(cv, elem);

    game = new Game(mazeData, keyelem, cv);
}
