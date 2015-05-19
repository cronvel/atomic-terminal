/*
	Copyright (c) 2015 Cédric Ronvel 
	
	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/



var csi = {} ;
module.exports = csi ;



var i ;



function parseNumbers( sequence )
{
	return sequence.split( ';' ).map( function( value ) { return parseInt( value , 10 ) ; } ) ;
}



csi.m = function characterAttributes( sequence )
{
	var params = parseNumbers( sequence ) ;
	if ( csi.m[ params ] ) { csi.m[ params ].call( this , params.slice( 1 ) ) ; }
} ;



csi.m[ 0 ] = function styleReset()
{
	this.cursor.bold = false ;
	this.cursor.dim = false ;
	this.cursor.italic = false ;
	this.cursor.underline = false ;
	this.cursor.blink = false ;
	this.cursor.inverse = false ;
	this.cursor.hidden = false ;
	this.cursor.strike = false ;
	console.log( 'styleReset!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 1 ] = function bold()
{
	this.cursor.bold = true ;
	console.log( 'bold!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 2 ] = function dim()
{
	this.cursor.dim = true ;
	console.log( 'dim!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 3 ] = function italic()
{
	this.cursor.italic = true ;
	console.log( 'italic!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 4 ] = function underline()
{
	this.cursor.underline = true ;
	console.log( 'underline!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 5 ] = function blink()
{
	this.cursor.blink = true ;
	console.log( 'blink!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 7 ] = function inverse()
{
	this.cursor.inverse = true ;
	console.log( 'inverse!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 8 ] = function hidden()
{
	this.cursor.hidden = true ;
	console.log( 'hidden!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 9 ] = function strike()
{
	this.cursor.strike = true ;
	console.log( 'strike!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 22 ] = function noBoldNoDim()
{
	this.cursor.bold = false ;
	this.cursor.dim = false ;
	console.log( 'nobold, nodim!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 23 ] = function noItalic()
{
	this.cursor.italic = false ;
	console.log( 'noitalic!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 24 ] = function noUnderline()
{
	this.cursor.underline = false ;
	console.log( 'nounderline!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 25 ] = function noBlink()
{
	this.cursor.blink = false ;
	console.log( 'noblink!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 27 ] = function noInverse()
{
	this.cursor.inverse = false ;
	console.log( 'noinverse!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 28 ] = function noHidden()
{
	this.cursor.hidden = false ;
	console.log( 'nohidden!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 29 ] = function noStrike()
{
	this.cursor.strike = false ;
	console.log( 'nostrike!!!' ) ;
	this.updateClassAttr() ;
} ;



function createSetFgColor( c )
{ 
	return function setFgColor() { this.cursor.fgColor = c ; } ;
} ;

function createSetBgColor( c )
{ 
	return function setBgColor() { this.cursor.bgColor = c ; } ;
} ;

for ( i = 0 ; i < 8 ; i ++ )
{
	csi.m[ 30 + i ] = createSetFgColor( i ) ;
	csi.m[ 90 + i ] = createSetFgColor( i + 8 ) ;
	csi.m[ 40 + i ] = createSetBgColor( i ) ;
	csi.m[ 100 + i ] = createSetBgColor( i + 8 ) ;
}

// TODO: default Fg and Bg colors
// TODO: 256 colors...


