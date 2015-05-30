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
var punycode = require( 'punycode' ) ;
var string = require( 'string-kit' ) ;
var tree = require( 'tree-kit' ) ;



function Terminal() { throw new Error( "[Front/Terminal] use Terminal.create() instead..." ) ; }
module.exports = Terminal ;



// Submodule parts
Terminal.csi = require( './csi.js' ) ;
Terminal.osc = require( './osc.js' ) ;
Terminal.keyboard = require( './keyboard.js' ) ;
Terminal.dom = require( './dom.js' ) ;



Terminal.create = function create( options )
{
	var terminal = Object.create( Terminal.prototype ) ;

	if ( ! options || typeof options !== 'object' ) { options = {} ; }

	terminal.width = options.width || 80 ;
	terminal.height = options.height || 24 ;

	terminal.domStyle = {
		terminal: document.getElementById( 'terminalStyle' ) ,
		palette: document.getElementById( 'paletteStyle' ) ,
		palette256: document.getElementById( 'palette256Style' )
	} ;

	terminal.cell = {
		width: 10 ,
		height: 19
	} ;

	terminal.font = {
		family: 'monospace' ,
		size: 18
	} ;

	terminal.cursor = {
		x: 1 ,
		y: 1 ,
		fgColor: false ,
		bgColor: false ,
		bold: false ,
		dim: false ,
		italic: false ,
		underline: false ,
		blink: false ,
		inverse: false ,
		hidden: false ,
		strike: false ,
		classAttr: null ,
		styleAttr: null ,

		// Position on the screen, may differ from x,y until .updateCursor() is called
		screenX: 1 ,
		screenY: 1 ,
		screenInverse: false ,
		screenHidden: false ,

		blinkTimer: undefined ,
		blinkTimeout: 500 ,
		steadyTimeout: 1000	,	// Time before blinking again

		updateNeeded: false ,
		restoreCellNeeded: false
	} ;

	terminal.savedCursorPosition = { x: 1 , y: 1 } ;
	terminal.blinkCursorTimeout = blinkCursorTimeout.bind( terminal ) ;

	terminal.state = [] ;

	terminal.remoteWin = remote.getCurrentWindow() ;

	terminal.palette = tree.extend( { deep: true } , [] , defaultPalette ) ;
	terminal.defaultFgColorIndex = 7 ;
	terminal.defaultBgColorIndex = 0 ;
	terminal.dimAlpha = 0.5 ;

	terminal.cwd = '/' ;	// Temp?

	//console.log( string.inspect( { style: 'color' } , terminal.palette ) ) ; process.exit() ;
	terminal.paletteStyle( true , true ) ;

	terminal.updateAttrs() ;
	terminal.createLayout() ;

	return terminal ;
} ;



Terminal.prototype.createLayout = function createLayout()
{
	this.terminalStyle() ;
	Terminal.dom.init( this ) ;

	document.addEventListener( 'keydown' , Terminal.keyboard.onKeyDown.bind( this ) , false ) ;
	document.addEventListener( 'keypress' , Terminal.keyboard.onKeyPress.bind( this ) , false ) ;
} ;



Terminal.prototype.terminalStyle = function terminalStyle()
{
	var css = '' ;

	css += 'body {\n' +
		'\tfont-family: ' + this.font.family + ', monospace;\n' +
		'\tfont-size: ' + this.font.size + 'px;\n' +
		'}\n' ;

	css += '#contentTable {\n' +
		'\twidth: ' + this.width * this.cell.width + 'px;\n' +
		'\theight: ' + this.height * this.cell.height + 'px;\n' +
		'}\n' ;

	css += '#contentTable td {\n' +
		'\twidth: ' + this.cell.width + 'px;\n' +
		'\theight: ' + this.cell.height + 'px;\n' +
		'}\n' ;

	css += '#contentTable td div {\n' +
		'\twidth: ' + this.cell.width + 'px;\n' +
		'\theight: ' + this.cell.height + 'px;\n' +
		'}\n' ;

	this.domStyle.terminal.innerHTML = css ;
} ;



/*
	.paletteStyle( lowPalette , highPalette )
		* lowPalette `boolean` if the low palette style should be rebuilt
		* highPalette `boolean` if the high palette (256 colors) style should be rebuilt
*/
Terminal.prototype.paletteStyle = function paletteStyle( lowPalette , highPalette )
{
	var self = this , i , css ;

	var setRegister = function( c , rgb ) {

		css += '.fgColor' + c + ' {\n' +
			'\tcolor: rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ');\n' +
			'}\n' +
			'.bgColor' + c + ' {\n' +
			'\tbackground-color: rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ');\n' +
			'}\n' +
			'.dim.fgColor' + c + ' {\n' +
			'\tcolor: rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + self.dimAlpha + ');\n' +
			'}\n' ;
	} ;

	if ( lowPalette )
	{
		css = '' ;
		for ( i = 0 ; i <= 15 ; i ++ ) { setRegister( i , this.palette[ i ] ) ; }
		this.domStyle.palette.innerHTML = css ;
	}

	if ( highPalette )
	{
		css = '' ;
		for ( i = 16 ; i <= 255 ; i ++ ) { setRegister( i , this.palette[ i ] ) ; }
		this.domStyle.palette256.innerHTML = css ;
	}
} ;



Terminal.prototype.start = function start()
{
	// The terminal is ready: run the underlying process!
	this.remoteWin.childProcess.run() ;
	this.remoteWin.childProcess.on( 'output' , Terminal.prototype.onStdout.bind( this ) ) ;

	this.blinkCursorTimeout() ;
} ;



/*
function parseNumbers( sequence )
{
	return sequence.split( ';' ).map( function( value ) { return parseInt( value , 10 ) ; } ) ;
}
*/



Terminal.prototype.updateAttrs = function updateAttrs()
{
	var attrs = this.attrsFromObject( this.cursor ) ;

	this.cursor.classAttr = attrs.class ;
	this.cursor.styleAttr = attrs.style ;
} ;



// Extra 'inverse' is used for cursor update, to not have to clone the object...
Terminal.prototype.attrsFromObject = function attrsFromObject( object , inverse )
{
	var fgColor , bgColor , attr = [] , style = [] , tmp ;

	fgColor = object.fgColor || object.fgColor === 0 ? object.fgColor : this.defaultFgColorIndex ;
	bgColor = object.bgColor || object.bgColor === 0 ? object.bgColor : this.defaultBgColorIndex ;

	if ( object.bold ) { attr.push( 'bold' ) ; }
	if ( object.dim ) { attr.push( 'dim' ) ; }
	if ( object.italic ) { attr.push( 'italic' ) ; }
	if ( object.underline ) { attr.push( 'underline' ) ; }
	if ( object.blink ) { attr.push( 'blink' ) ; }
	if ( object.strike ) { attr.push( 'strike' ) ; }

	if ( ! object.inverse !== ! inverse ) { tmp = bgColor ; bgColor = fgColor ; fgColor = tmp ; }	// jshint ignore:line

	if ( object.hidden ) { fgColor = bgColor ; }

	if ( Array.isArray( fgColor ) ) { style.push( 'color: rgb(' + fgColor.join( ',' ) + ');' ) ; }
	else { attr.push( 'fgColor' + fgColor ) ; }

	if ( Array.isArray( bgColor ) ) { style.push( 'background-color: rgb(' + bgColor.join( ',' ) + ');' ) ; }
	else { attr.push( 'bgColor' + bgColor ) ; }

	return {
		class: attr.join( ' ' ) || null ,
		style: style.join( ' ' ) || null
	} ;
} ;



// blink: called by a blinking cursor method
Terminal.prototype.updateCursor = function updateCursor( restoreCell , blink )
{
	var attrs ;

	// Check if something has changed, or if the cursor is visible or not
	if ( this.cursor.screenHidden ||
		( ! blink && this.cursor.x === this.cursor.screenX && this.cursor.y === this.cursor.screenY ) )
	{
		return ;
	}

	if ( restoreCell &&
		this.cursor.screenX >= 1 && this.cursor.screenX <= this.width &&
		this.cursor.screenY >= 1 && this.cursor.screenY <= this.height )
	{
		// Restore the previous cell with the correct attributes
		attrs = this.attrsFromObject( this.state[ this.cursor.screenY - 1 ][ this.cursor.screenX - 1 ] ) ;
		Terminal.dom.setCursor( this.cursor.screenX - 1 , this.cursor.screenY - 1 , attrs ) ;
	}

	// Update the screenX and screenY
	this.cursor.screenX = this.cursor.x ;
	this.cursor.screenY = this.cursor.y ;


	if ( this.cursor.x > this.width ) { return ; }

	if ( ! blink && this.cursor.blinkTimer )
	{
		this.cursor.screenInverse = true ;
		clearTimeout( this.cursor.blinkTimer ) ;
		this.cursor.blinkTimer = setTimeout( this.blinkCursorTimeout , this.cursor.steadyTimeout ) ;
	}

	// Inverse the cell where the cursor is
	attrs = this.attrsFromObject( this.state[ this.cursor.screenY - 1 ][ this.cursor.screenX - 1 ] , this.cursor.screenInverse ) ;
	Terminal.dom.setCursor( this.cursor.screenX - 1 , this.cursor.screenY - 1 , attrs ) ;
} ;



function blinkCursorTimeout()
{
	this.cursor.screenInverse = ! this.cursor.screenInverse ;
	this.updateCursor( false , true ) ;
	this.cursor.blinkTimer = setTimeout( this.blinkCursorTimeout , this.cursor.blinkTimeout ) ;
}



Terminal.prototype.printChar = function printChar( char )
{
	if ( this.cursor.x > this.width )
	{
		this.cursor.x = 1 ;
		this.cursor.y ++ ;

		if ( this.cursor.y > this.height )
		{
			//this.cursor.y = this.height ;	// now done by .scrollDown()
			this.scrollDown() ;
		}
	}

	var attrs = {
		class: this.cursor.classAttr,
		style: this.cursor.styleAttr
	} ;

	Terminal.dom.setCell( this.cursor.x - 1 , this.cursor.y - 1 , char , attrs ) ;

	this.cursor.x ++ ;

	this.cursor.updateNeeded = true ;

	//console.log( [ this.cursor.x , this.cursor.y ] ) ;
} ;



Terminal.prototype.scrollDown = function scrollDown()
{
	Terminal.dom.insertRow() ;

	// Update cursor's coordinate
	this.cursor.y -- ;
	this.cursor.screenY -- ;
} ;



// Notice: PTY may emit both a carriage return followed by a newline when a single newline is emitted from the real child process
Terminal.prototype.newLine = function newLine( carriageReturn )
{
	if ( carriageReturn ) { this.cursor.x = 1 ; }

	this.cursor.y ++ ;

	if ( this.cursor.y > this.height )
	{
		//this.cursor.y = this.height ;	// now done by .scrollDown()
		this.scrollDown() ;
	}

	this.cursor.updateNeeded = true ;
	this.cursor.restoreCellNeeded = true ;

	//console.log( [ this.cursor.x , this.cursor.y ] ) ;
} ;



Terminal.prototype.moveTo = function moveTo( x , y )
{
	//console.log( '< moveTo coordinate: (' + this.cursor.x + ',' + this.cursor.y + ') {' + x + ',' + y + '}' ) ;

	if ( x !== undefined )
	{
		this.cursor.x = Math.max( 1 , Math.min( x , this.width + 1 ) ) ;	// bound to 1-width range
	}

	if ( y !== undefined )
	{
		this.cursor.y = Math.max( 1 , Math.min( y , this.height ) ) ;	// bound to 1-height range
	}

	this.cursor.updateNeeded = true ;
	this.cursor.restoreCellNeeded = true ;

	//console.log( '> moveTo coordinate: (' + this.cursor.x + ',' + this.cursor.y + ')' ) ;
} ;



Terminal.prototype.move = function move( x , y )
{
	//console.log( '< move coordinate: (' + this.cursor.x + ',' + this.cursor.y + ')' ) ;

	if ( x !== undefined )
	{
		this.cursor.x = Math.max( 1 , Math.min( this.cursor.x + x , this.width + 1 ) ) ;	// bound to 1-width range
	}

	if ( y !== undefined )
	{
		this.cursor.y = Math.max( 1 , Math.min( this.cursor.y + y , this.height ) ) ;	// bound to 1-height range
	}

	this.cursor.updateNeeded = true ;
	this.cursor.restoreCellNeeded = true ;

	//console.log( '> move coordinate: (' + this.cursor.x + ',' + this.cursor.y + ')' ) ;
} ;



Terminal.prototype.saveCursorPosition = function saveCursorPosition()
{
	this.savedCursorPosition = { x: this.cursor.x , y: this.cursor.y } ;
} ;



Terminal.prototype.restoreCursorPosition = function restoreCursorPosition()
{
	this.moveTo( this.savedCursorPosition.x , this.savedCursorPosition.y ) ;
} ;



Terminal.prototype.erase = function erase( type )
{
	var x , y , attrs ,
		yMin , yMax , xMinInline , xMaxInline , xMin , xMax ;

	switch ( type )
	{
		case 'all' :
			yMin = 1 ;
			yMax = this.height ;
			xMinInline = 1 ;
			xMaxInline = this.width ;
			break ;

		case 'line' :
			yMin = this.cursor.y ;
			yMax = this.cursor.y ;
			xMinInline = 1 ;
			xMaxInline = this.width ;
			break ;

		case 'above' :
			yMin = 1 ;
			yMax = this.cursor.y ;
			xMinInline = 1 ;
			xMaxInline = Math.min( this.cursor.x , this.width ) ;	// Erase the cursor's cell too
			break ;

		case 'below' :
			yMin = this.cursor.y ;
			yMax = this.height ;
			xMinInline = Math.min( this.cursor.x , this.width ) ;	// Erase the cursor's cell too
			xMaxInline = this.width ;
			break ;

		case 'lineAfter' :
			yMin = this.cursor.y ;
			yMax = this.cursor.y ;
			xMinInline = Math.min( this.cursor.x , this.width ) ;	// Erase the cursor's cell too
			xMaxInline = this.width ;
			break ;

		case 'lineBefore' :
			yMin = this.cursor.y ;
			yMax = this.cursor.y ;
			xMinInline = 1 ;
			xMaxInline = Math.min( this.cursor.x , this.width ) ;	// Erase the cursor's cell too
			break ;

		default :
			throw new Error( '.erase(): unknown type "' + type + '"' ) ;
			return ; // jshint cryin 'bout unreachable return. Can we remove this line ?
	}

	for ( y = yMin ; y <= yMax ; y ++ )
	{
		xMin = y === yMin ? xMinInline : 1 ;
		xMax = y === yMax ? xMaxInline : this.width ;

		for ( x = xMin ; x <= xMax ; x ++ )
		{
			attrs = this.attrsFromObject( {
				fgColor: this.cursor.fgColor ,
				bgColor: this.cursor.bgColor
			} ) ;

			Terminal.dom.setCell( x - 1 , y - 1 , ' ' , attrs ) ;
		}
	}
} ;



Terminal.prototype.delete = function delete_( n )
{
	var i ;

	if ( this.cursor.x > this.width ) { return ; }

	if ( n === undefined ) { n = 1 ; }

	for ( i = 0 ; i < n ; i ++ )
	{
		Terminal.dom.deleteCell( this.cursor.x - 1 , this.cursor.y - 1 ) ;
	}

	this.cursor.updateNeeded = true ;
} ;



Terminal.prototype.insert = function insert( n )
{
	var i ;

	if ( this.cursor.x > this.width ) { return ; }

	if ( n === undefined ) { n = 1 ; }

	for ( i = 0 ; i < n ; i ++ )
	{
		Terminal.dom.insertCell( this.cursor.x - 1 , this.cursor.y - 1 ) ;
	}

	this.cursor.screenX += n ;
	this.cursor.updateNeeded = true ;
	this.cursor.restoreCellNeeded = true ;
} ;



Terminal.prototype.deleteLine = function deleteLine( n )
{
	var i ;

	if ( n === undefined ) { n = 1 ; }

	for ( i = 0 ; i < n ; i ++ )
	{
		Terminal.dom.deleteRow( this.cursor.y - 1 ) ;
	}

	this.cursor.updateNeeded = true ;
} ;



Terminal.prototype.insertLine = function insertLine( n )
{
	var i ;

	if ( n === undefined ) { n = 1 ; }

	for ( i = 0 ; i < n ; i ++ )
	{
		Terminal.dom.insertRow( this.cursor.y - 1 ) ;
	}

	this.cursor.screenY += n ;
	this.cursor.updateNeeded = true ;
	this.cursor.restoreCellNeeded = true ;
} ;





			/* STDOUT parsing */



Terminal.prototype.onStdout = function onStdout( chunk )
{
	var buffer , char , codepoint ,	found , bytes ,
		index = 0 , length = chunk.length ;

	// Reset cursor update
	this.cursor.updateNeeded = false ;
	this.cursor.restoreCellNeeded = false ;

	//if ( ! Buffer.isBuffer( chunk ) ) { throw new Error( 'not a buffer' ) ; }
	//console.log( 'Chunk: \n' + string.inspect( { style: 'color' } , chunk ) ) ;
	//console.error( 'Chunk:\n' + string.escape.control( chunk.toString() ) ) ;

	// I know that converting from binary string is deprecated, but I don't really have the choice here
	if ( typeof chunk === 'string' ) { chunk = new Buffer( chunk , 'binary' ) ; }

	if ( this.onStdoutRemainder )
	{
		// If there is a remainder, just unshift it
		chunk = Buffer.concat( [ this.onStdoutRemainder , chunk ] ) ;
		//console.log( 'Found a remainder, final chunk \n' + string.inspect( { style: 'color' } , chunk ) ) ;
	}

	while ( index < length )
	{
		found = false ;
		bytes = 1 ;

		if ( chunk[ index ] <= 0x1f || chunk[ index ] === 0x7f )
		{
			// Those are ASCII control character and DEL key
			bytes = this.controlCharacter( chunk , index ) ;
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

			buffer = chunk.slice( index , index + bytes ) ;
			char = buffer.toString( 'utf8' ) ;

			if ( bytes > 2 ) { codepoint = punycode.ucs2.decode( char )[ 0 ] ; }
			else { codepoint = char.charCodeAt( 0 ) ; }

			//console.log( 'multibyte char "' + char + '"' ) ;
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

			this.onStdoutRemainder = chunk.slice( index ) ;
			//console.log( 'bytes === null, this.onStdoutRemainder: \n' + string.inspect( { style: 'color' } , this.onStdoutRemainder ) + this.onStdoutRemainder.toString() ) ;
			return ;
		}

		index += bytes ;
	}

	this.onStdoutRemainder = null ;

	if ( this.cursor.updateNeeded ) { this.updateCursor( this.cursor.restoreCellNeeded ) ; }
} ;



// TODO: switch case -> hashmap
Terminal.prototype.controlCharacter = function controlCharacter( chunk , index )
{
	switch ( chunk[ index ] )
	{
		// Backspace, it does *NOT* delete, it's just like the left arrow
		case 0x08 :
		case 0x7f :
			this.move( -1 ) ;
			return 1 ;

		// New Line
		case 0x0a :
			this.newLine() ;
			return 1 ;

		// Carriage Return
		// PTY may emit both a carriage return followed by a newline when a single newline is emitted from the real child process
		case 0x0d :
			this.moveTo( 1 ) ;
			return 1 ;

		// Escape
		case 0x1b :
			if ( index + 1 < chunk.length ) { return this.escapeSequence( chunk , index + 1 ) ; }
			return 1 ;

		default :
			console.error( string.format( 'Not implemented: Control 0x%x' , chunk[ index ] ) ) ;
			return 1 ;
	}
} ;



// TODO: switch case -> hashmap
Terminal.prototype.escapeSequence = function escapeSequence( chunk , index )
{
	var char = String.fromCharCode( chunk[ index ] ) ;

	switch ( char )
	{
		case '[' :
			if ( index + 1 < chunk.length ) { return this.csiSequence( chunk , index + 1 ) ; }
			return null ;

		case ']' :
			if ( index + 1 < chunk.length ) { return this.oscSequence( chunk , index + 1 ) ; }
			return null ;

		case '7' :
			this.saveCursorPosition() ;
			return 2 ;

		case '8' :
			this.restoreCursorPosition() ;
			return 2 ;

		case 'F' :	// move to bottom-left
			this.moveTo( 1 , this.height ) ;
			return 2 ;

		// Deprecated: no-op, change the character set
		case ' ' :
		case '#' :
		case '%' :
		case '(' :
		case ')' :
		case '*' :
		case '+' :
		case '-' :
		case '/' :
			return 3 ;

		default :
			// Unknown sequence
			// console.error( 'Not implemented: ESC "' + char + '"' ) ;

			/*
			this.printChar( '\x1b' ) ;
			this.printChar( char ) ;
			//*/
			return 2 ;
	}
} ;



Terminal.prototype.csiSequence = function csiSequence( chunk , index )
{
	var i , char , sequence = '' ;


	for ( i = index ; i < chunk.length ; i ++ )
	{
		char = String.fromCharCode( chunk[ i ] ) ;

		// Check for sequence terminator
		if ( chunk[ i ] >= 0x40 )
		{
			if ( Terminal.csi[ char ] ) { Terminal.csi[ char ].call( this , sequence ) ; }
			else { console.error( 'Not implemented: CSI "' + char + '" (sequence: "' + sequence + '")' ) ; }

			return sequence.length + 3 ;	// ESC + [ + sequence + terminator
		}

		sequence += char ;
	}

	// We should never reach here, except if the buffer was too short
	return null ;
} ;



Terminal.prototype.oscSequence = function oscSequence( chunk , index )
{
	var i , char , sequence = '' , num ;


	for ( i = index ; i < chunk.length ; i ++ )
	{
		char = String.fromCharCode( chunk[ i ] ) ;

		// Check for sequence terminator
		// 0x07 = Bell
		// 0x1b = Esc
		// 0x5c = \
		if ( ( chunk[ i ] === 0x07 ) || ( chunk[ i ] === 0x1b && chunk[ i + 1 ] === 0x5c ) )
		{
			index = sequence.indexOf( ';' ) ;

			if ( index > 0 )
			{
				num = parseInt( sequence.slice( 0 , index ) , 10 ) ;

				if ( ! isNaN( num ) )
				{
					if ( Terminal.osc[ num ] ) { Terminal.osc[ num ].call( this , sequence.slice( index + 1 ) ) ; }
					else { console.error( 'Not implemented: OSC "' + num + '" (sequence: ' + sequence.slice( index + 1 ) + '")' ) ; }
				}
				else
				{
					console.log( "Trouble: NaN!" ) ;
				}
			}

			return sequence.length + 2 + ( chunk[ i ] === 0x07 ? 1 : 2 ) ;	// ESC + ] + sequence + Bell/ST
		}

		sequence += char ;
	}

	console.log( "Trouble: " + string.escape.control( chunk.toString() ) ) ;
	// We should never reach here, except if the buffer was too short
	return null ;
} ;





			/* Misc */



// This is used for adjustement of floating point value, before applying Math.floor()
var adjustFloor = 0.0000001 ;

// Build the default palette

// This make atomic-terminal and terminal-kit use the same colorScheme
var defaultPalette = require( 'terminal-kit/lib/colorScheme/atomic-terminal.json' ) ;

( function buildDefaultPalette()
{
	var register , offset , factor , l ;

	for ( register = 16 ; register < 232 ; register ++ )
	{
		// RGB 6x6x6
		offset = register - 16 ;
		factor = 255 / 5 ;
		defaultPalette[ register ] = {
			r: Math.floor( ( Math.floor( offset / 36 + adjustFloor ) % 6 ) * factor + adjustFloor ) ,
			g: Math.floor( ( Math.floor( offset / 6 + adjustFloor ) % 6 ) * factor + adjustFloor ) ,
			b: Math.floor( ( offset % 6 ) * factor + adjustFloor ) ,
			names: []
		} ;
	}

	for ( register = 232 ; register <= 255 ; register ++ )
	{
		// Grayscale 0..23
		offset = register - 231 ;	// not 232, because the first of them is not a #000000 black
		factor = 255 / 25 ;	// not 23, because the last is not a #ffffff white
		l = Math.floor( offset * factor + adjustFloor ) ;
		defaultPalette[ register ] = { r: l , g: l , b: l , names: [] } ;
	}
} )() ;
