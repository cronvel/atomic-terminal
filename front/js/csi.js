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





			/* Styles and colors */



csi.m = function characterAttributes( sequence )
{
	var params = parseNumbers( sequence ) ;
	if ( csi.m[ params[ 0 ] ] ) { csi.m[ params[ 0 ] ].apply( this , params.slice( 1 ) ) ; }
} ;



csi.m[ 0 ] = function styleReset()
{
	this.cursor.fgColor = false ;
	this.cursor.bgColor = false ;
	this.cursor.bold = false ;
	this.cursor.dim = false ;
	this.cursor.italic = false ;
	this.cursor.underline = false ;
	this.cursor.blink = false ;
	this.cursor.inverse = false ;
	this.cursor.hidden = false ;
	this.cursor.strike = false ;
	//console.log( 'styleReset!!!' ) ;
	this.updateClassAttr() ;
} ;

csi.m[ 1 ] = function bold()
{
	this.cursor.bold = true ;
	this.updateClassAttr() ;
} ;

csi.m[ 2 ] = function dim()
{
	this.cursor.dim = true ;
	this.updateClassAttr() ;
} ;

csi.m[ 3 ] = function italic()
{
	this.cursor.italic = true ;
	this.updateClassAttr() ;
} ;

csi.m[ 4 ] = function underline()
{
	this.cursor.underline = true ;
	this.updateClassAttr() ;
} ;

csi.m[ 5 ] = function blink()
{
	this.cursor.blink = true ;
	this.updateClassAttr() ;
} ;

csi.m[ 7 ] = function inverse()
{
	this.cursor.inverse = true ;
	this.updateClassAttr() ;
} ;

csi.m[ 8 ] = function hidden()
{
	this.cursor.hidden = true ;
	this.updateClassAttr() ;
} ;

csi.m[ 9 ] = function strike()
{
	this.cursor.strike = true ;
	this.updateClassAttr() ;
} ;

csi.m[ 22 ] = function noBoldNoDim()
{
	this.cursor.bold = false ;
	this.cursor.dim = false ;
	this.updateClassAttr() ;
} ;

csi.m[ 23 ] = function noItalic()
{
	this.cursor.italic = false ;
	this.updateClassAttr() ;
} ;

csi.m[ 24 ] = function noUnderline()
{
	this.cursor.underline = false ;
	this.updateClassAttr() ;
} ;

csi.m[ 25 ] = function noBlink()
{
	this.cursor.blink = false ;
	this.updateClassAttr() ;
} ;

csi.m[ 27 ] = function noInverse()
{
	this.cursor.inverse = false ;
	this.updateClassAttr() ;
} ;

csi.m[ 28 ] = function noHidden()
{
	this.cursor.hidden = false ;
	this.updateClassAttr() ;
} ;

csi.m[ 29 ] = function noStrike()
{
	this.cursor.strike = false ;
	this.updateClassAttr() ;
} ;



function createSetFgColor( c )
{ 
	return function setFgColor() {
		this.cursor.fgColor = c ;
		this.updateClassAttr() ;
	} ;
} ;

function createSetBgColor( c )
{ 
	return function setBgColor() {
		this.cursor.bgColor = c ;
		this.updateClassAttr() ;
	} ;
} ;

for ( i = 0 ; i < 8 ; i ++ )
{
	csi.m[ 30 + i ] = createSetFgColor( i ) ;
	csi.m[ 90 + i ] = createSetFgColor( i + 8 ) ;
	csi.m[ 40 + i ] = createSetBgColor( i ) ;
	csi.m[ 100 + i ] = createSetBgColor( i + 8 ) ;
}

csi.m[ 39 ] = createSetFgColor( false ) ;
csi.m[ 49 ] = createSetBgColor( false ) ;



csi.m[ 38 ] = function setHighFgColor()
{
	var trueColor = arguments[ 0 ] === 2 ;
	
	if ( ! trueColor )
	{
		// 256 colors
		this.cursor.fgColor = arguments[ 1 ] ;
		this.updateClassAttr() ;
	}
} ;



csi.m[ 48 ] = function setHighBgColor()
{
	var trueColor = arguments[ 0 ] === 2 ;
	
	if ( ! trueColor )
	{
		// 256 colors
		this.cursor.bgColor = arguments[ 1 ] ;
		this.updateClassAttr() ;
	}
} ;



