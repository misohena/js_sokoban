MazeUtil = {
    maxElement: function(arr, pred)
    {
	if(arr.length <= 0){
	    return null;
	}
	var result = arr[0];
	for(var i = 1; i < arr.length; ++i){
	    if(pred(result, arr[i])){
		result = arr[i];
	    }
	}
	return result;
    }
};


Cell = {
    OUTSIDE: 0,
    FLOOR: 1,
    WALL: 2
};

function Maze(cells, player)
{
    this.cells = cells;
    this.player = player;

    this.width = MazeUtil.maxElement(cells, function(lhs, rhs){return lhs.length < rhs.length;}).length;
    this.height = cells.length;
}
Maze.prototype = {
    cellAt: function(x, y)
    {
	return (y >= 0 && y < this.cells.length && x >= 0 && x < this.cells[y].length)
	    ? this.cells[y][x] : Cell.OUTSIDE;
    }
};


function loadMaze(strs)
{
    var assert = function(cond) { if(!cond){ throw "Failed to load maze.";}};
    var player = null;
    var cells = [];

    for(var y in strs){

	var cellsRow = [];

	for(var x = 0; x < strs[y].length; ++x){ // for/inではダメだった。Firefoxは動いたけど。
	    switch(strs[y].charAt(x)){ //strs[y][x]と書いたらIEで動かなかった。
	    case '#': cellsRow.push(Cell.WALL); break;
	    case '@': cellsRow.push(Cell.FLOOR); assert(!player); player = {x:x, y:y}; break;
	    case ' ': cellsRow.push(Cell.FLOOR); break;
	    default: cellsRow.push(Cell.OUTSIDE); break;
	    }
	}

	cells.push(cellsRow);
    }

    return new Maze(cells, player);
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



function MazeShape(maze)
{
    var WALL_HEIGHT = 1.0;

    this.vertices = new Array();
    this.transformed = new Array();
    this.surfaces = new Array();

    var imWall = new Image();
    imWall.src = "img/brick.png";
    var imFloor = new Image();
    imFloor.src = "img/oak.png";

    var idx;
    for(var y = 0; y < maze.height; ++y){
	for(var x = 0; x < maze.width; ++x){
	    switch(maze.cellAt(x, y)){
	    case Cell.WALL:
		idx = this.vertices.length/3;
		this.vertices.push(x, WALL_HEIGHT, -y);
		this.vertices.push(x, WALL_HEIGHT, -y-1);
		this.vertices.push(x+1, WALL_HEIGHT, -y-1);
		this.vertices.push(x+1, WALL_HEIGHT, -y);
		this.vertices.push(x, 0, -y);
		this.vertices.push(x, 0, -y-1);
		this.vertices.push(x+1, 0, -y-1);
		this.vertices.push(x+1, 0, -y);

		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx+0, idx+1, idx+2, idx+3],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx+0, idx+4, idx+5, idx+1],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx+1, idx+5, idx+6, idx+2],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx+2, idx+6, idx+7, idx+3],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx+3, idx+7, idx+4, idx+0],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		break;
	    case Cell.FLOOR:
		idx = this.vertices.length/3;
		this.vertices.push(x, 0, -y);
		this.vertices.push(x, 0, -y-1);
		this.vertices.push(x+1, 0, -y-1);
		this.vertices.push(x+1, 0, -y);

		this.surfaces.push(new Surface(
		    this.transformed,
		    [idx+0, idx+1, idx+2, idx+3],
		    [0,0, 0,1, 1,1, 1,0],
		    imFloor, "#000"));
		break;
	    }
        }
    }
}



function init()
{
    timerRotation = null;
    cameraAngle = Math.PI*0.4;
    maze = null;
    mazeShape = null;
}

function splitMazeLines(mazeText)
{
    var arrayLines = new Array();
    arrayLines.push("");
    for(var i = 0; i < mazeText.length; ++i){
	var ch = mazeText.charAt(i);
	if(ch == '\n'){
	    arrayLines.push("");
	}
	else{
	    arrayLines[arrayLines.length-1] += ch;
	}
    }
    return arrayLines;
}

function updateMazeModel(arrayLines)
{
    maze = loadMaze(arrayLines);
    //outputMazeText(maze); return;

    mazeShape = new MazeShape(maze);

    drawMazeShape();
}


function startRotation()
{
    if(timerRotation){
	return;
    }
    var onTime = function()
    {
	cameraAngle += Math.PI/180*5;
	drawMazeShape();
    };
    timerRotation = setInterval(onTime, 100);
}

function stopRotation()
{
    if(!timerRotation){
	return;
    }
    clearInterval(timerRotation);
    timerRotation = null;
}


function drawMazeShape()
{
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

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

    // Transform vertices.
    var vcount = mazeShape.vertices.length / 3;
    var src = new Vec3();
    var dst = new Vec3();
    for(var vi = 0; vi < vcount; ++vi){
	src.set(mazeShape.vertices[vi*3+0], mazeShape.vertices[vi*3+1], mazeShape.vertices[vi*3+2]);
	dst.mul(src, mat);
	mazeShape.transformed[vi*3+0] = dst[0];
	mazeShape.transformed[vi*3+1] = dst[1];
	mazeShape.transformed[vi*3+2] = dst[2];
    }

    // Cull backfacing surfaces.
    var frontFaces = new Array();
    for(var si = 0; si < mazeShape.surfaces.length; ++si){
	if(mazeShape.surfaces[si].isFrontFace()){
	    frontFaces.push(mazeShape.surfaces[si]);
	}
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


var dataMazeTest =
["...#####.......",
 "...#   #.......",
 ".###   #######.",
 ".#       @   #.",
 ".## ## #   ###.",
 "..# #      #...",
 "..# ####   #...",
 "..#        #...",
 "..##########..."];

function main()
{
    init();
    updateMazeModel(dataMazeTest);
    startRotation();
}

