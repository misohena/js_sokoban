
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
	return (y >= 0 && y < cells.length && x >= 0 && x < cells[y].length)
	    ? cells[y][x] : Cell.OUTSIDE;
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
        return;
    }
/*
    var maze = loadMaze(dataMazeTest);
    outputMazeText(maze);
*/

    var vertices = new Array();
    var surfaces = new Array();

/*
    for(var y = 0; y < maze.height; ++y){
	for(var x = 0; x < maze.width; ++x){
	    switch(maze.cellAt(x, y)){
	    case '#':
		makeSquare(x, -y..................
			   break;
	    }
        }
    }
*/
    //drawSurface(

}
