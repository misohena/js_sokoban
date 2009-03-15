/*
 * (u1,v1)=>(x1,y1), (u2,v2)=>(x2,y2), (u3,v3)=>(x3,y3)になるような変換行列の要素a～fを求める。
 *
 * [a c e] [u1 u2 u3]   [x1 x2 x3]
 * [b d f] [v1 v2 v3] = [y1 y2 y3]
 * [0 0 1] [1  1  1 ]   [1  1  1 ]
 *
 * [a c e]   [x1 x2 x3] [u1 u2 u3]^-1
 * [b d f] = [y1 y2 y3] [v1 v2 v3]
 * [0 0 1]   [1  1  1 ] [1  1  1 ]
 *
 * det = u1*(v2-v3) + u2*(v3-v1) + u3*(v1-v2);
 * [a c e]   [x1 x2 x3] [(v2 - v3) (u3 - u2) (u2*v3 - u3*v2)]
 * [b d f] = [y1 y2 y3] [(v3 - v1) (u1 - u3) (u3*v1 - u1*v3)] /det
 * [0 0 1]   [1  1  1 ] [(v1 - v2) (u2 - u1) (u1*v2 - u2*v1)]
 *
 * a = (x1*(v2-v3) + x2*(v3-v1) + x3*(v1-v2)) / det
 * b = (y1*(v2-v3) + y2*(v3-v1) + y3*(v1-v2)) / det
 * c = (x1*(u3-u2) + x2*(u1-u3) + x3*(u2-u1)) / det
 * d = (y1*(u3-u2) + y2*(u1-u3) + y3*(u2-u1)) / det
 * e = (x1*(u2*v3 - u3*v2) + x2*(u3*v1 - u1*v3) + x3*(u1*v2 - u2*v1)) / det
 * f = (y1*(u2*v3 - u3*v2) + y2*(u3*v1 - u1*v3) + y3*(u1*v2 - u2*v1)) / det
 *
 * (v3-v1) = (v2-v1)+(v3-v2)なので
 *
 * det = u1*(v2-v3) + u2*((v2-v1)+(v3-v2)) + u3*(v1-v2)
 *     = u1*(v2-v3) + u2*(v2-v1) + u2*(v3-v2) + u3*(v1-v2)
 *     = (u3-u2)*(v1-v2) - (u1-u2)*(v3-v2)
 *
 * 同様に
 * a = ((x3-x2)*(v1-v2) - (x1-x2)*(v3-v2)) / det
 * b = ((y3-y2)*(v1-v2) - (y1-y2)*(v3-v2)) / det
 * c = ((x1-x2)*(u3-u2) - (x3-x2)*(u1-u2)) / det
 * d = ((y1-y2)*(u3-u2) - (y3-y2)*(u1-u2)) / det
 *
 * e = (x1*(u2*v3 - u3*v2) + x2*(u3*v1 - u1*v3) + x3*(u1*v2 - u2*v1)) / det
 * f = (y1*(u2*v3 - u3*v2) + y2*(u3*v1 - u1*v3) + y3*(u1*v2 - u2*v1)) / det
 */
function drawSurface(ctx, surface)
{
    var tex = surface.getTexture();
    var x1 = surface.getTransformedX(0);
    var y1 = surface.getTransformedY(0);
    var x2 = surface.getTransformedX(1);
    var y2 = surface.getTransformedY(1);
    var x3 = surface.getTransformedX(2);
    var y3 = surface.getTransformedY(2);

    var u1 = surface.getTexX(0)*tex.width;
    var v1 = surface.getTexY(0)*tex.height;
    var u2 = surface.getTexX(1)*tex.width;
    var v2 = surface.getTexY(1)*tex.height;
    var u3 = surface.getTexX(2)*tex.width;
    var v3 = surface.getTexY(2)*tex.height;

    var det = (u3-u2)*(v1-v2) - (u1-u2)*(v3-v2);

    var a = (x1*(v2-v3) + x2*(v3-v1) + x3*(v1-v2)) / det;
    var b = (y1*(v2-v3) + y2*(v3-v1) + y3*(v1-v2)) / det;
    var c = (x1*(u3-u2) + x2*(u1-u3) + x3*(u2-u1)) / det;
    var d = (y1*(u3-u2) + y2*(u1-u3) + y3*(u2-u1)) / det;
    var e = (x1*(u2*v3 - u3*v2) + x2*(u3*v1 - u1*v3) + x3*(u1*v2 - u2*v1)) / det;
    var f = (y1*(u2*v3 - u3*v2) + y2*(u3*v1 - u1*v3) + y3*(u1*v2 - u2*v1)) / det;

    ctx.beginPath();
    ctx.moveTo(surface.getTransformedX(0), surface.getTransformedY(0));
    for(var vi = 1; vi < surface.countVertex(); ++vi){
	ctx.lineTo(surface.getTransformedX(vi), surface.getTransformedY(vi));
    }
    ctx.clip();

    ctx.save();
    ctx.setTransform(a,b,c,d,e,f);
    ctx.drawImage(tex, 0, 0);
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(surface.getTransformedX(0), surface.getTransformedY(0));
    for(var vi = 1; vi < surface.countVertex(); ++vi){
	ctx.lineTo(surface.getTransformedX(vi), surface.getTransformedY(vi));
    }
    ctx.stroke();
}





/*

var surface = {
    transformed: [0.5*320, 0.2*240+20, 0, 0.2*320, 0.8*240, 0, 0.9*320, 0.9*240, 0, 0.75*320, 0.1*240, 0],
    indices: [0,1,2,3],
    texcoord: [0.5, 0.2, 0.2, 0.8, 0.9, 0.9, 0.75, 0.1],
    texture: im,
    countVertex: function(){return this.indices.length;},
    getTexture: function(){return texture;},
    getTransformedX: function(index){return this.vertices[this.indices[index]*3+0];},
    getTransformedY: function(index){return this.vertices[this.indices[index]*3+1];},
    getTransformedZ: function(index){return this.vertices[this.indices[index]*3+2];},
    getTexX: function(index){return this.texcoord[this.indices[index]*2+0];},
    getTexY: function(index){return this.texcoord[this.indices[index]*2+1];}
};

ctx.clearRect(0,0,320,240);
drawSurface(ctx, surface);


vertices.push(x,y,z);
vertices.push(x,y,z);
vertices.push(x,y,z);
vertices.push(x,y,z);
texcoords.push(0,0);
texcoords.push(0,1);
texcoords.push(1,1);
texcoords.push(1,0);
transformeds;
surfaces.push(new Surface(vertices, transformed, [-4,-3,-2,-1], texcoords, brick));

verticesからtransformedを作る。変換行列をかけるだけ。

裏面カリング

Zソート

描画

*/
