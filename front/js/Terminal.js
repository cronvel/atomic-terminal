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



// Load modules
var remote = require( 'remote' ) ;
var async = require( 'async-kit' ) ;
var string = require( 'string-kit' ) ;
var tree = require( 'tree-kit' ) ;
var dom = require( 'dom-kit' ) ;

var processCom = require( '../../processCom.js' ) ;



function Terminal() { throw new Error( "[Front/Terminal] use Terminal.create() instead..." ) ; }
module.exports = Terminal ;



// Submodule parts
Terminal.csi = require( './csi.js' ) ;



Terminal.create = function create( options )
{
	var terminal = Object.create( Terminal.prototype ) ;
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	terminal.width = options.width || 80 ;
	terminal.height = options.height || 24 ;
	
	terminal.domStyle = {
		terminal: document.getElementById( 'terminal-style' )
	} ;
	
	terminal.cell = {
		width: 8 ,
		height: 16
	} ;
	
	terminal.font = {
		family: 'monospace' ,
		size: 16
	}
	
	terminal.cursor = {
		x: 1 ,
		y: 1 ,
		bold: false ,
		dim: false ,
		italic: false ,
		underline: false ,
		blink: false ,
		inverse: false ,
		hidden: false ,
		strike: false ,
		classAttr: ''
	} ;
	
	terminal.remoteWin = remote.getCurrentWindow() ;
	
	terminal.domContent = document.getElementById( 'content' ) ;
	
	terminal.createLayout() ;
	
	return terminal ;
} ;



Terminal.prototype.createLayout = function createLayout()
{
	var x , y , html = '' ;
	
	this.terminalStyle() ;
	
	html += '<table>' ;
	
	for ( y = 1 ; y <= this.height ; y ++ )
	{
		html += '<tr>' ;
		
		for ( x = 1 ; x <= this.width ; x ++ )
		{
			html += '<td><div id="' + x + ',' + y + '"></div></td>' ;
		}
		
		html += '</tr>' ;
	}
	
	html += '</table>' ;
	
	this.domContent.innerHTML = html ;
} ;	



Terminal.prototype.terminalStyle = function terminalStyle()
{
	var css = '' ;
	
	css += '#content {\n' +
		'\tfont-family: ' + this.font.family + ', monospace;\n' +
		'\tfont-size: ' + this.font.size + 'px;\n' +
		'}\n' ;
	
	css += '#content table {\n' +
		'\twidth: ' + this.width * this.cell.width + 'px;\n' +
		'\theight: ' + this.height * this.cell.height + 'px;\n' +
		'}\n' ;
	
	css += '#content td {\n' +
		'\twidth: ' + this.cell.width + 'px;\n' +
		'\theight: ' + this.cell.height + 'px;\n' +
		'}\n' ;
	
	css += '#content td div {\n' +
		'\twidth: ' + this.cell.width + 'px;\n' +
		'\theight: ' + this.cell.height + 'px;\n' +
		'}\n' ;
	
	this.domStyle.terminal.innerHTML = css ;
} ;	



Terminal.prototype.start = function start()
{
	var self = this , spawned ;
	
	spawned = processCom.exec( this.remoteWin.command.program , this.remoteWin.command.args ) ;
	spawned.stdout.on( 'data' , Terminal.prototype.onStdout.bind( this ) ) ;
	
	//this.remoteWin.processCom.stdout.on( 'data' , Terminal.prototype.onStdout.bind( this ) ) ;
} ;	



Terminal.prototype.onStdout = function onStdout( chunk )
{
	var i , id ;
	
	chunk = chunk.toString( 'utf8' ) ;
	
	for ( i = 0 ; i < data.length ; i ++ )
	{
		id = this.cursor.x + ',' + this.cursor.y ;
		document.getElementById( id ).textContent = data[ i ] ;
		
		this.cursor.x ++ ;
		
		if ( this.cursor.x > this.width )
		{
			this.cursor.x = 1 ;
			this.cursor.y ++ ;
			
			if ( this.cursor.y > this.height )
			{
				// I don't know what to do ATM
			}
		}
		
		console.log( [ this.cursor.x , this.cursor.y ] ) ;
	}
} ;	



Terminal.prototype.onStdout = function onStdout( chunk )
{
	var i , j , buffer , startBuffer , char , codepoint ,
		keymapCode , keymapStartCode , keymap , keymapList ,
		regexp , matches , bytes , found , handlerResult ,
		index = 0 , length = chunk.length ;
	
	while ( index < length )
	{
		found = false ;
		bytes = 1 ;
		
		if ( chunk[ index ] <= 0x1f || chunk[ index ] === 0x7f )
		{
			// Those are ASCII control character and DEL key
			
			switch ( chunk[ index ] )
			{
				case 0x0a :
					this.newLine() ;
					break ;
				case 0x0d :
					this.moveTo( 1 , undefined ) ;
					break ;
				case 0x1b :
					if ( index + 1 < length ) { bytes = this.escapeSequence( chunk , index + 1 ) ; }
					break ;
			}
		}
		else if ( chunk[ index ] >= 0x80 )
		{
			// Unicode bytes per char guessing
			if ( chunk[ index ] < 0xc0 ) { continue ; }	// We are in a middle of an unicode multibyte sequence... Something fails somewhere, we will just continue for now...
			else if ( chunk[ index ] < 0xe0 ) { bytes = 2 ; }
			else if ( chunk[ index ] < 0xf0 ) { bytes = 3 ; }
			else if ( chunk[ index ] < 0xf8 ) { bytes = 4 ; }
			else if ( chunk[ index ] < 0xfc ) { bytes = 5 ; }
			else { bytes = 6 ; }
			
			buffer = chunk.slice( index , index.bytes ) ;
			char = buffer.toString( 'utf8' ) ;
			
			if ( bytes > 2 ) { codepoint = punycode.ucs2.decode( char )[ 0 ] ; }
			else { codepoint = char.charCodeAt( 0 ) ; }
			
			this.printChar( char ) ;
			//this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: codepoint , code: buffer } ) ;
		}
		else
		{
			// Standard ASCII
			char = String.fromCharCode( chunk[ index ] ) ;
			this.printChar( char ) ;
			//this.emit( 'key' , char , [ char ] , { isCharacter: true , codepoint: chunk[ index ] , code: chunk[ index ] } ) ;
		}
		
		if ( bytes === null )
		{
			// Special case here: we should accumulate more of the buffer
			
			//		/!\ !!! THIS IS NOT IMPLEMENTED YET !!! /!\
			
			throw new Error( '[front/Terminal.js] bytes === null is not implemented yet' ) ;
		}
		
		index += bytes ;
	}
} ;



Terminal.prototype.escapeSequence = function escapeSequence( chunk , index )
{
	switch ( String.fromCharCode( chunk[ index ] ) )
	{
		case '[' :
			console.log( 'CSI detected!!!' ) ;
			if ( index + 1 < chunk.length ) { return this.csiSequence( chunk , index + 1 ) ; }
	}
	
	return null ;
} ;



Terminal.prototype.csiSequence = function csiSequence( chunk , index )
{
	var i , bytes , char , sequence = '' ;
	
	
	for ( i = index ; i < chunk.length ; i ++ )
	{
		char = String.fromCharCode( chunk[ i ] ) ;
		
		// Check for sequence terminator
		if ( chunk[ i ] >= 0x40 )
		{
			if ( Terminal.csi[ char ] ) { Terminal.csi[ char ].call( this , sequence ) ; }
			return sequence.length + 3 ;	// ESC + [ + sequence + terminator
		}
		
		sequence += char ;
	}
	
	// We should never reach here, except if the buffer was too short
	return null ;
} ;



/*
function parseNumbers( sequence )
{
	return sequence.split( ';' ).map( function( value ) { return parseInt( value , 10 ) ; } ) ;
}
*/



Terminal.prototype.printChar = function printChar( char )
{
	var id = this.cursor.x + ',' + this.cursor.y ;
	var element = document.getElementById( id ) ;
	
	element.textContent = char ;
	console.log( 'attr: ' + this.cursor.classAttr ) ;
	element.setAttribute( 'class' , this.cursor.classAttr ) ;
	
	
	this.cursor.x ++ ;
	
	if ( this.cursor.x > this.width )
	{
		this.cursor.x = 1 ;
		this.cursor.y ++ ;
		
		if ( this.cursor.y > this.height )
		{
			// I don't know what to do ATM... we should scroll down, will do that later
			this.cursor.y = this.height ;
		}
	}
	
	//console.log( [ this.cursor.x , this.cursor.y ] ) ;
} ;



Terminal.prototype.updateClassAttr = function updateClassAttr()
{
	var attr = [] ;
	
	if ( this.cursor.bold ) { attr.push( 'bold' ) ; }
	if ( this.cursor.dim ) { attr.push( 'dim' ) ; }
	if ( this.cursor.italic ) { attr.push( 'italic' ) ; }
	if ( this.cursor.underline ) { attr.push( 'underline' ) ; }
	if ( this.cursor.blink ) { attr.push( 'blink' ) ; }
	if ( this.cursor.inverse ) { attr.push( 'inverse' ) ; }
	if ( this.cursor.hidden ) { attr.push( 'hidden' ) ; }
	if ( this.cursor.strike ) { attr.push( 'strike' ) ; }
	
	this.cursor.classAttr = attr.join( ' ' ) ;
} ;



Terminal.prototype.newLine = function newLine()
{
	this.cursor.x = 1 ;
	this.cursor.y ++ ;
	
	if ( this.cursor.y > this.height )
	{
		// I don't know what to do ATM... we should scroll down, will do that later
		this.cursor.y = this.height ;
	}
	
	//console.log( [ this.cursor.x , this.cursor.y ] ) ;
} ;



Terminal.prototype.moveTo = function moveTo( x , y )
{
	if ( x !== undefined )
	{
		this.cursor.x = Math.max( 1 , Math.min( x , this.width ) ) ;	// bound to 1-width range
	}
	
	if ( y !== undefined )
	{
		this.cursor.y = Math.max( 1 , Math.min( y , this.height ) ) ;	// bound to 1-height range
	}
} ;


