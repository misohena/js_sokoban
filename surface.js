// Title: JavaScript Surface Renderer
// Author: AKIYAMA Kouhei
// Since: 2009-03

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
    if(Math.abs(det) <= 1e-6){
	return;
    }

    var a = (x1*(v2-v3) + x2*(v3-v1) + x3*(v1-v2)) / det;
    var b = (y1*(v2-v3) + y2*(v3-v1) + y3*(v1-v2)) / det;
    var c = (x1*(u3-u2) + x2*(u1-u3) + x3*(u2-u1)) / det;
    var d = (y1*(u3-u2) + y2*(u1-u3) + y3*(u2-u1)) / det;
    var e = (x1*(u2*v3 - u3*v2) + x2*(u3*v1 - u1*v3) + x3*(u1*v2 - u2*v1)) / det;
    var f = (y1*(u2*v3 - u3*v2) + y2*(u3*v1 - u1*v3) + y3*(u1*v2 - u2*v1)) / det;

    ctx.save();

    if(surface.isNeedToClip()){
	ctx.beginPath();
	ctx.moveTo(surface.getTransformedX(0), surface.getTransformedY(0));
	for(var vi = 1; vi < surface.countVertex(); ++vi){
	    ctx.lineTo(surface.getTransformedX(vi), surface.getTransformedY(vi));
	}
	ctx.clip();
    }

    ctx.transform(a,b,c,d,e,f); //SafariがsetTransformを実装していなかったので注意。
    ctx.drawImage(tex, 0, 0);
    ctx.restore();

    // Draw Poly-lines
    var lineStyle = surface.getLineStyle();
    if(lineStyle){
	ctx.save();
	ctx.strokeStyle = lineStyle;
	ctx.beginPath();
	ctx.moveTo(surface.getTransformedX(0), surface.getTransformedY(0));
	for(var vi = 1; vi < surface.countVertex(); ++vi){
	    ctx.lineTo(surface.getTransformedX(vi), surface.getTransformedY(vi));
	}
	ctx.closePath();
	ctx.stroke();
	ctx.restore();
    }
}



function Surface(transformed, indices, texcoord, texture, lineStyle)
{
    this.transformed = transformed;
    this.indices = indices;
    this.texcoord = texcoord;
    this.texture = texture;
    this.lineStyle = lineStyle;
}
Surface.prototype = {
    countVertex: function(){return this.indices.length;},
    getTexture: function(){return this.texture;},
    getTransformedX: function(index){return this.transformed[this.indices[index]*3+0];},
    getTransformedY: function(index){return this.transformed[this.indices[index]*3+1];},
    getTransformedZ: function(index){return this.transformed[this.indices[index]*3+2];},
    getTexX: function(index){return this.texcoord[index*2+0];},
    getTexY: function(index){return this.texcoord[index*2+1];},
    getLineStyle: function(index) { return this.lineStyle;},

    getMostFrontZ: function()
    {
	return Math.max(this.getTransformedZ(0), this.getTransformedZ(1), this.getTransformedZ(2));
    },
    isFrontFace: function()
    {
	var x1 = this.getTransformedX(0);
	var y1 = this.getTransformedY(0);
	var x2 = this.getTransformedX(1);
	var y2 = this.getTransformedY(1);
	var x3 = this.getTransformedX(2);
	var y3 = this.getTransformedY(2);
	var x21 = x2 - x1;
	var x32 = x3 - x2;
	var y21 = y2 - y1;
	var y32 = y3 - y2;
	return x21*y32 - y21*x32 < 0;
    },

    isNeedToClip: function()
    {
	return !(this.texcoord.length == 8
		 && this.texcoord[0] == 0
		 && this.texcoord[1] == 0
		 && this.texcoord[2] == 0
		 && this.texcoord[3] == 1
		 && this.texcoord[4] == 1
		 && this.texcoord[5] == 1
		 && this.texcoord[6] == 1
		 && this.texcoord[7] == 0);///@todo 回転形も考慮する。
    }
};

