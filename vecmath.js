// Title: JavaScript Vector Math Library
// Author: AKIYAMA Kouhei
// Since: 2009


/*
 * VecMathImpl内ではVec3やMat44を直接使いません。
 * 引数の型はメソッド名で表現し、引数の値はarg[i]の形でアクセスします。argは配列でもオブジェクトでもかまいません。
 * 内部的に一時オブジェクトを作らなければならないときは、配列を作成します。
 * 結果は必ず別途指定された場所へ格納します(結果がスカラーになる場合を除く)。
 * オブジェクトや配列を作成して返すことはありません。
 *
 * オブジェクトの時に数値から文字列への変換が必要になるのが玉に瑕。
 */
VecMathImpl = {
    // number op(Vec3)
    lengthSqVec3: function(arg)
    {
	return arg[0]*arg[0] + arg[1]*arg[1] + arg[2]*arg[2];
    },

    lengthVec3: function(arg)
    {
	return Math.sqrt(arg[0]*arg[0] + arg[1]*arg[1] + arg[2]*arg[2]);
    },

    // number op(Vec3, Vec3)
    dotVec3Vec3: function(lhs, rhs)
    {
	return lhs[0] * rhs[0] + lhs[1] * rhs[1] + lhs[2] * rhs[2];
    },

    // Vec3 op(Vec3)
    normalizeVec3: function(result, arg)
    {
	var len = VecMathImpl.lengthVec3(arg);
	result[0] = arg[0] / len;
	result[1] = arg[1] / len;
	result[2] = arg[2] / len;
    },

    // Vec3 op(Vec3, Vec3)
    addVec3Vec3: function(result, lhs, rhs)
    {
        result[0] = lhs[0] + rhs[0];
        result[1] = lhs[1] + rhs[1];
        result[2] = lhs[2] + rhs[2];
    },

    subVec3Vec3: function(result, lhs, rhs)
    {
        result[0] = lhs[0] - rhs[0];
        result[1] = lhs[1] - rhs[1];
        result[2] = lhs[2] - rhs[2];
    },

    crossVec3Vec3: function(result, lhs, rhs)
    {
	var x = lhs[1] * rhs[2] - lhs[2] * rhs[1];
	var y = lhs[2] * rhs[0] - lhs[0] * rhs[2];
	var z = lhs[0] * rhs[1] - lhs[1] * rhs[0];
	result[0] = x;
	result[1] = y;
	result[2] = z;
    },

    // Vec3 op(Vec3, Scalar)
    mulVec3Scalar: function(result, lhs, rhs)
    {
        result[0] = lhs[0] * rhs;
        result[1] = lhs[1] * rhs;
        result[2] = lhs[2] * rhs;
    },

    divVec3Scalar: function(result, lhs, rhs)
    {
        result[0] = lhs[0] / rhs;
        result[1] = lhs[1] / rhs;
        result[2] = lhs[2] / rhs;
    },


    // Vec4 op(Vec4, Mat44)
    mulVec4Mat44: function(result, lhs, rhs)
    {
	var lhs0 = lhs[0];
	var lhs1 = lhs[1];
	var lhs2 = lhs[2];
	var lhs3 = lhs[3];
	result[0] = lhs0*rhs[0] + lhs1*rhs[4] + lhs2*rhs[8] + lhs3*rhs[12];
	result[1] = lhs0*rhs[1] + lhs1*rhs[5] + lhs2*rhs[9] + lhs3*rhs[13];
	result[2] = lhs0*rhs[2] + lhs1*rhs[6] + lhs2*rhs[10] + lhs3*rhs[14];
	result[3] = lhs0*rhs[3] + lhs1*rhs[7] + lhs2*rhs[11] + lhs3*rhs[15];
    },

    // Vec3 op(Vec3, Mat44)
    mulVec3Mat44: function(result, lhs, rhs)
    {
	var lhs0 = lhs[0];
	var lhs1 = lhs[1];
	var lhs2 = lhs[2];

	var tmp3 = lhs0*rhs[3] + lhs1*rhs[7] + lhs2*rhs[11] + rhs[15];
	result[0] = (lhs0*rhs[0] + lhs1*rhs[4] + lhs2*rhs[8] + rhs[12]) / tmp3;
	result[1] = (lhs0*rhs[1] + lhs1*rhs[5] + lhs2*rhs[9] + rhs[13]) / tmp3;
	result[2] = (lhs0*rhs[2] + lhs1*rhs[6] + lhs2*rhs[10] + rhs[14]) / tmp3;
    },

    // Mat44 op(Mat44, Mat44)
    mulMat44Mat44_Impl: function(result, lhs, rhs)
    {
        result[0] = lhs[0]*rhs[0] + lhs[1]*rhs[4] + lhs[2]*rhs[8 ] + lhs[3]*rhs[12];
        result[1] = lhs[0]*rhs[1] + lhs[1]*rhs[5] + lhs[2]*rhs[9 ] + lhs[3]*rhs[13];
        result[2] = lhs[0]*rhs[2] + lhs[1]*rhs[6] + lhs[2]*rhs[10] + lhs[3]*rhs[14];
        result[3] = lhs[0]*rhs[3] + lhs[1]*rhs[7] + lhs[2]*rhs[11] + lhs[3]*rhs[15];

        result[4] = lhs[4]*rhs[0] + lhs[5]*rhs[4] + lhs[6]*rhs[8 ] + lhs[7]*rhs[12];
        result[5] = lhs[4]*rhs[1] + lhs[5]*rhs[5] + lhs[6]*rhs[9 ] + lhs[7]*rhs[13];
        result[6] = lhs[4]*rhs[2] + lhs[5]*rhs[6] + lhs[6]*rhs[10] + lhs[7]*rhs[14];
        result[7] = lhs[4]*rhs[3] + lhs[5]*rhs[7] + lhs[6]*rhs[11] + lhs[7]*rhs[15];

        result[8] = lhs[8]*rhs[0] + lhs[9]*rhs[4] + lhs[10]*rhs[8 ] + lhs[11]*rhs[12];
        result[9] = lhs[8]*rhs[1] + lhs[9]*rhs[5] + lhs[10]*rhs[9 ] + lhs[11]*rhs[13];
        result[10]= lhs[8]*rhs[2] + lhs[9]*rhs[6] + lhs[10]*rhs[10] + lhs[11]*rhs[14];
        result[11]= lhs[8]*rhs[3] + lhs[9]*rhs[7] + lhs[10]*rhs[11] + lhs[11]*rhs[15];

        result[12]= lhs[12]*rhs[0] + lhs[13]*rhs[4] + lhs[14]*rhs[8 ] + lhs[15]*rhs[12];
        result[13]= lhs[12]*rhs[1] + lhs[13]*rhs[5] + lhs[14]*rhs[9 ] + lhs[15]*rhs[13];
        result[14]= lhs[12]*rhs[2] + lhs[13]*rhs[6] + lhs[14]*rhs[10] + lhs[15]*rhs[14];
        result[15]= lhs[12]*rhs[3] + lhs[13]*rhs[7] + lhs[14]*rhs[11] + lhs[15]*rhs[15];
    },

    mulMat44Mat44: function(result, lhs, rhs)
    {
	if(result === lhs || result === rhs){
	    var tmp = new Array(16);
	    VecMathImpl.mulMat44Mat44_Impl(tmp, lhs, rhs);
	    for(var i = 0; i < 16; ++i){
		result[i] = tmp[i];
	    }
	}
	else{
	    VecMathImpl.mulMat44Mat44_Impl(result, lhs, rhs);
	}
    },    


    // Mat44 op(...)
    setMat44Identity: function(result)
    {
	result[0]  = 1; result[1]  = 0; result[2]  = 0; result[3]  = 0;
	result[4]  = 0; result[5]  = 1; result[6]  = 0; result[7]  = 0;
	result[8]  = 0; result[9]  = 0; result[10] = 1; result[11] = 0;
	result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
    },

    setMat44Scale1: function(result, s)
    {
	result[0]  = s; result[1]  = 0; result[2]  = 0; result[3]  = 0;
	result[4]  = 0; result[5]  = s; result[6]  = 0; result[7]  = 0;
	result[8]  = 0; result[9]  = 0; result[10] = s; result[11] = 0;
	result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
    },

    setMat44Scale3: function(result, sx, sy, sz)
    {
	result[0]  =sx; result[1]  = 0; result[2]  = 0; result[3]  = 0;
	result[4]  = 0; result[5]  =sy; result[6]  = 0; result[7]  = 0;
	result[8]  = 0; result[9]  = 0; result[10] =sz; result[11] = 0;
	result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
    },

    setMat44Translation: function(result, tx, ty, tz)
    {
	result[0]  = 1; result[1]  = 0; result[2]  = 0; result[3]  = 0;
	result[4]  = 0; result[5]  = 1; result[6]  = 0; result[7]  = 0;
	result[8]  = 0; result[9]  = 0; result[10] = 1; result[11] = 0;
	result[12] =tx; result[13] =ty; result[14] =tz; result[15] = 1;
    },

    setMat44RotationX: function(result, angle)
    {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	result[0]  = 1; result[1]  = 0; result[2]  = 0; result[3]  = 0;
	result[4]  = 0; result[5]  = c; result[6]  = s; result[7]  = 0;
	result[8]  = 0; result[9]  =-s; result[10] = c; result[11] = 0;
	result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
    },

    setMat44RotationY: function(result, angle)
    {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	result[0]  = c; result[1]  = 0; result[2]  =-s; result[3]  = 0;
	result[4]  = 0; result[5]  = 1; result[6]  = 0; result[7]  = 0;
	result[8]  = s; result[9]  = 0; result[10] = c; result[11] = 0;
	result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
    },

    setMat44RotationZ: function(result, angle)
    {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	result[0]  = c; result[1]  = s; result[2]  = 0; result[3]  = 0;
	result[4]  =-s; result[5]  = c; result[6]  = 0; result[7]  = 0;
	result[8]  = 0; result[9]  = 0; result[10] = 1; result[11] = 0;
	result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
    },

    setMat44LookAtLH: function(result, pos, target, up)
    {
	var zaxis = new Array(3);
	VecMathImpl.subVec3Vec3(zaxis, target, pos);
	VecMathImpl.normalizeVec3(zaxis, zaxis);
	var xaxis = new Array(3);
	VecMathImpl.crossVec3Vec3(xaxis, up, zaxis);
	VecMathImpl.normalizeVec3(xaxis, xaxis);
	var yaxis = new Array(3);
	VecMathImpl.crossVec3Vec3(yaxis, zaxis, xaxis);

	result[0]  = xaxis[0]; result[1]  = yaxis[0]; result[2]  = zaxis[0]; result[3]  = 0;
	result[4]  = xaxis[1]; result[5]  = yaxis[1]; result[6]  = zaxis[1]; result[7]  = 0;
	result[8]  = xaxis[2]; result[9]  = yaxis[2]; result[10] = zaxis[2]; result[11] = 0;
	result[12] = -VecMathImpl.dotVec3Vec3(xaxis, pos);
	result[13] = -VecMathImpl.dotVec3Vec3(yaxis, pos);
	result[14] = -VecMathImpl.dotVec3Vec3(zaxis, pos);
	result[15] = 1;
    },


    copy: function(dst, src, count)
    {
        for(var i = 0; i < count; ++i){
            dst[i] = src[i] || 0;
        }
    },

    fill: function(dst, value, count)
    {
        for(var i = 0; i < count; ++i){
            dst[i] = value;
        }
    }
}

// ---------------------------------------------------------------------------
// Vec3
// ---------------------------------------------------------------------------

function Vec3()
{
    this.set.apply(this, arguments);
}

Vec3.prototype = {
    set: function()
    {
        switch(arguments.length){
        case 1: VecMathImpl.copy(this, arguments[0], 3); break;
        default: VecMathImpl.copy(this, arguments, 3); break;
        }
    },

    add: function(lhs, rhs)
    {
	VecMathImpl.addVec3Vec3(this, lhs, rhs);
    },

    sub: function(lhs, rhs)
    {
	VecMathImpl.subVec3Vec3(this, lhs, rhs);
    },

    cross: function(lhs, rhs)
    {
	VecMathImpl.crossVec3Vec3(this, lhs, rhs);
    },

    length: VecMathImpl.lengthVec3,

    normalize: function(src)
    {
	VecMathImpl.normalizeVec3(this, src ? src : this);
    },

    mul: function(lhs, rhs)
    {
	///@todo もっと他のパターンも実装する。
	VecMathImpl.mulVec3Mat44(this, lhs, rhs);
    },

    toString: function()
    {
        return "Vec3(" + this[0] + "," + this[1] + "," + this[2] + ")";
    }
}

Vec3.dot = VecMathImpl.dotVec3Vec3;


// ---------------------------------------------------------------------------
// Mat44
// ---------------------------------------------------------------------------

function Mat44()
{
    for(var i = 0; i < 16; ++i){
        this[i] = arguments[i] || 0;
    }
}

Mat44.prototype = {
    mul: function(lhs, rhs)
    {
	///@todo もっと他のパターンも実装する。
	VecMathImpl.mulMat44Mat44(this, lhs, rhs);
    },
    toString: function()
    {
        return "Mat44("
	    + this[0] + "," + this[1] + "," + this[2] + "," + this[3] + ",\n"
	    + this[4] + "," + this[5] + "," + this[6] + "," + this[7] + ",\n"
	    + this[8] + "," + this[9] + "," + this[10] + "," + this[11] + ",\n"
	    + this[12] + "," + this[13] + "," + this[14] + "," + this[15] + ",\n"
	    + ")";
    }
}

Mat44.newIdentity = function()
{
    var m = new Mat44();
    VecMathImpl.setMat44Identity(m);
    return m;
}

Mat44.newZero = function()
{
    ///@todo うーん、Mat44が未初期化なら良いのにナァ。
    var m = new Mat44();
    return m;
}

Mat44.newLookAtLH = function(pos, target, up)
{
    var m = new Mat44();
    VecMathImpl.setMat44LookAtLH(m, pos, target, up);
    return m;
}


