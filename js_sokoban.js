
Cell = {
    OUTSIDE: 0,
    FLOOR: 1,
    WALL: 2
};


MazeUtil = {
    maxElem: function(arr, pred)
    {
	if(arr.length <= 0){
	    return null;
	}
	var result = arr[0];
	for(var i = 1; i < result; ++i){
	    if(pred(result, arr[i])){
		result = arr[i];
	    }
	}
	return result;
    }

};


function Maze(){
    this.initialize.apply(this, arguments);
}
Maze.prototype = {
    initialize: function(cells, player)
    {
	this.cells = cells;
	this.player = player;

	this.width = MazeUtil.maxElem(cells, function(lhs, rhs){return lhs.length < rhs.length;}).length;
	this.height = cells.length;
    },

    cellAt: function(x, y)
    {
	return (y >= 0 && y < this.cells.length && x >= 0 && x < this.cells[y].length)
	    ? this.cells[y][x] : Cell.OUTSIDE;
    },

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
    var canvas = document.getElementById("canvas");
    if(!canvas.getContext){
	alert("Undefined canvas.getContext.");
        return;
    }
    canvas.style.cssText = "border: 1px solid;"
    var ctx = canvas.getContext("2d");

    var maze = loadMaze(dataMazeTest);
    //outputMazeText(maze);

    var WALL_HEIGHT = 1.0;

    var vertices = new Array();
    var transformed = new Array();
    var surfaces = new Array();

    var imWall = new Image();
    imWall.src = "img/brick.png";
    var imFloor = new Image();
    imFloor.src = "img/oak.png";

    var idx;
    for(var y = 0; y < maze.height; ++y){
	for(var x = 0; x < maze.width; ++x){
	    switch(maze.cellAt(x, y)){
	    case Cell.WALL:
		idx = vertices.length/3;
		vertices.push(x, WALL_HEIGHT, -y);
		vertices.push(x, WALL_HEIGHT, -y-1);
		vertices.push(x+1, WALL_HEIGHT, -y-1);
		vertices.push(x+1, WALL_HEIGHT, -y);
		vertices.push(x, 0, -y);
		vertices.push(x, 0, -y-1);
		vertices.push(x+1, 0, -y-1);
		vertices.push(x+1, 0, -y);

		surfaces.push(new Surface(
		    transformed,
		    [idx+0, idx+1, idx+2, idx+3],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		surfaces.push(new Surface(
		    transformed,
		    [idx+0, idx+4, idx+5, idx+1],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		surfaces.push(new Surface(
		    transformed,
		    [idx+1, idx+5, idx+6, idx+2],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		surfaces.push(new Surface(
		    transformed,
		    [idx+2, idx+6, idx+7, idx+3],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		surfaces.push(new Surface(
		    transformed,
		    [idx+3, idx+7, idx+4, idx+0],
		    [0,0, 0,1, 1,1, 1,0],
		    imWall, "#000"));
		break;
	    case Cell.FLOOR:
		idx = vertices.length/3;
		vertices.push(x, 0, -y);
		vertices.push(x, 0, -y-1);
		vertices.push(x+1, 0, -y-1);
		vertices.push(x+1, 0, -y);

		surfaces.push(new Surface(
		    transformed,
		    [idx+0, idx+1, idx+2, idx+3],
		    [0,0, 0,1, 1,1, 1,0],
		    imFloor, "#000"));
		break;
	    }
        }
    }

    var angle = Math.PI/2;

    var onTime = function()
    {
	var centerX = maze.width/2;
	var centerY = maze.height/2;
	var eyeX = centerX + Math.cos(angle) * 20;
	var eyeY = centerY + Math.sin(angle) * 20;

	angle += Math.PI/180*5;

	var matView = Mat44.newLookAtLH(new Vec3(eyeX,20,-eyeY), new Vec3(centerX,0,-centerY), new Vec3(0,1,0));
	var matProj = new Mat44(
	    2/15,0,0,0,
	    0,2/(15*canvas.height/canvas.width),0,0,
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
	var vcount = vertices.length / 3;
	var src = new Vec3();
	var dst = new Vec3();
	for(var vi = 0; vi < vcount; ++vi){
	    src.set(vertices[vi*3+0], vertices[vi*3+1], vertices[vi*3+2]);
	    dst.mul(src, mat);
	    transformed[vi*3+0] = dst[0];
	    transformed[vi*3+1] = dst[1];
	    transformed[vi*3+2] = dst[2];
	}

	// Cull backfacing surfaces.
	var frontFaces = new Array();
	for(var si = 0; si < surfaces.length; ++si){
	    if(surfaces[si].isFrontFace()){
		frontFaces.push(surfaces[si]);
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
    };

    setInterval(onTime, 100);
    //setTimeout(onTime, 100);

}

