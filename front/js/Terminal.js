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
var async = require( 'async-kit' ) ;
var string = require( 'string-kit' ) ;
var tree = require( 'tree-kit' ) ;
var dom = require( 'dom-kit' ) ;



function Terminal() { throw new Error( "[Front/Terminal] use Terminal.create() instead..." ) ; }
module.exports = Terminal ;



// Submodule parts
Terminal.csi = require( './csi.js' ) ;
Terminal.osc = require( './osc.js' ) ;
Terminal.keyboard = require( './keyboard.js' ) ;



Terminal.create = function create( options )
{
	var terminal = Object.create( Terminal.prototype ) ;
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	terminal.width = options.width || 80 ;
	terminal.height = options.height || 24 ;
	
	terminal.domContentDiv = document.getElementById( 'contentDiv' ) ;
	terminal.domContentTable = document.getElementById( 'contentTable' ) ;
	
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
	var x , y , trElement , tdElement , divElement ;
	
	this.terminalStyle() ;
	
	for ( y = 1 ; y <= this.height ; y ++ )
	{
		this.state[ y - 1 ] = [] ;
		trElement = document.createElement( 'tr' ) ;
		
		for ( x = 1 ; x <= this.width ; x ++ )
		{
			this.state[ y - 1 ][ x - 1 ] = { char: ' ' } ;
			divElement = document.createElement( 'div' ) ;
			divElement.setAttribute( 'class' , 'fgColor' + this.defaultFgColorIndex + ' bgColor' + this.defaultBgColorIndex ) ;
			tdElement = document.createElement( 'td' ) ;
			tdElement.appendChild( divElement ) ;
			trElement.appendChild( tdElement ) ;
		}
		
		this.domContentTable.appendChild( trElement ) ;
	}
} ;	



Terminal.prototype.terminalStyle = function terminalStyle()
{
	var css = '' ;
	
	css += '#contentDiv {\n' +
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
		
		css += '#contentTable td div.fgColor' + c + ' {\n' +
			'\tcolor: rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ');\n' +
			'}\n' +
			'#contentTable td div.bgColor' + c + ' {\n' +
			'\tbackground-color: rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ');\n' +
			'}\n' +
			'#contentTable td div.dim.fgColor' + c + ' {\n' +
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
	var self = this ;
	
	// The terminal is ready: run the underlying process!
	this.remoteWin.childProcess.run() ;
	this.remoteWin.childProcess.on( 'output' , Terminal.prototype.onStdout.bind( this ) ) ;
	
	// Give focus to the content div and register keyDown events
	this.domContentDiv.focus() ;
	this.domContentDiv.onkeydown = Terminal.keyboard.onKeyDown.bind( this ) ;
	this.domContentDiv.onkeypress = Terminal.keyboard.onKeyPress.bind( this ) ;
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
	var attrs , element ;
	
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
		element = this.domContentTable.rows[ this.cursor.screenY - 1 ].cells[ this.cursor.screenX - 1 ].firstChild ;
		element.setAttribute( 'class' , attrs.class ) ;
		element.setAttribute( 'style' , attrs.style ) ;
	}
	
	// Update the screenX and screenY
	this.cursor.screenX = this.cursor.x ;
	this.cursor.screenY = this.cursor.y ;
	
	if ( ! blink && this.cursor.blinkTimer )
	{
		this.cursor.screenInverse = true ;
		clearTimeout( this.cursor.blinkTimer ) ;
		this.cursor.blinkTimer = setTimeout( this.blinkCursorTimeout , this.cursor.steadyTimeout ) ;
	}
	
	// Inverse the cell where the cursor is
	attrs = this.attrsFromObject( this.state[ this.cursor.screenY - 1 ][ this.cursor.screenX - 1 ] , this.cursor.screenInverse ) ;
	element = this.domContentTable.rows[ this.cursor.screenY - 1 ].cells[ this.cursor.screenX - 1 ].firstChild ;
	element.setAttribute( 'class' , attrs.class ) ;
	element.setAttribute( 'style' , attrs.style ) ;
} ;



function blinkCursorTimeout()
{
	this.cursor.screenInverse = ! this.cursor.screenInverse ;
	this.updateCursor( false , true ) ;
	this.cursor.blinkTimer = setTimeout( this.blinkCursorTimeout , this.cursor.blinkTimeout ) ;
}



Terminal.prototype.printChar = function printChar( char )
{
	var element ;
	
	// Get the div inside the table cell
	//try {
	element = this.domContentTable.rows[ this.cursor.y - 1 ].cells[ this.cursor.x - 1 ].firstChild ;
	//} catch ( error ) { console.log( 'Error, coordinate: (' + this.cursor.x + ',' + this.cursor.y + ')  [' + this.width + ',' + this.height + ']' ) ; throw error ; }
	
	// Update the internal state
	this.state[ this.cursor.y - 1 ][ this.cursor.x - 1 ] = {
		char: char ,
		fgColor: this.cursor.fgColor ,
		bgColor: this.cursor.bgColor ,
		bold: this.cursor.bold ,
		dim: this.cursor.dim ,
		italic: this.cursor.italic ,
		underline: this.cursor.underline ,
		blink: this.cursor.blink ,
		inverse: this.cursor.inverse ,
		hidden: this.cursor.hidden ,
		strike: this.cursor.strike
	} ;
	
	element.textContent = char ;
	
	//console.log( 'attr: ' + this.cursor.classAttr ) ;
	element.setAttribute( 'class' , this.cursor.classAttr ) ;
	element.setAttribute( 'style' , this.cursor.styleAttr ) ;
	
	
	this.cursor.x ++ ;
	
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
	
	this.cursor.updateNeeded = true ;
	
	//console.log( [ this.cursor.x , this.cursor.y ] ) ;
} ;



Terminal.prototype.scrollDown = function scrollDown()
{
	var x , trElement , tdElement , divElement , lastStateRow ;
	
	// Delete the first row
	this.state.shift() ;
	this.domContentTable.deleteRow( 0 ) ;
	
	// Create a new row at the end of the table
	lastStateRow = this.state.length ;
	this.state[ lastStateRow ] = [] ;
	trElement = this.domContentTable.insertRow() ;
	
	for ( x = 1 ; x <= this.width ; x ++ )
	{
		this.state[ lastStateRow ][ x - 1 ] = { char: ' ' } ;
		divElement = document.createElement( 'div' ) ;
		divElement.setAttribute( 'class' , 'fgColor' + this.defaultFgColorIndex + ' bgColor' + this.defaultBgColorIndex ) ;
		tdElement = document.createElement( 'td' ) ;
		tdElement.appendChild( divElement ) ;
		trElement.appendChild( tdElement ) ;
	}
	
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
		this.cursor.x = Math.max( 1 , Math.min( x , this.width ) ) ;	// bound to 1-width range
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
		this.cursor.x = Math.max( 1 , Math.min( this.cursor.x + x , this.width ) ) ;	// bound to 1-width range
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
	var x , y , attrs , element ,
		yMin , yMax , xMinInline , xMaxInline , xMin , xMax ;
	
	attrs = this.attrsFromObject( {
		fgColor: this.cursor.fgColor ,
		bgColor: this.cursor.bgColor
	} ) ;
	
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
			xMaxInline = this.cursor.x ;	// Erase the cursor's cell too
			break ;
		
		case 'below' :
			yMin = this.cursor.y ;
			yMax = this.height ;
			xMinInline = this.cursor.x ;	// Erase the cursor's cell too
			xMaxInline = this.width ;
			break ;
		
		case 'lineAfter' :
			yMin = this.cursor.y ;
			yMax = this.cursor.y ;
			xMinInline = this.cursor.x ;	// Erase the cursor's cell too
			xMaxInline = this.width ;
			break ;
		
		case 'lineBefore' :
			yMin = this.cursor.y ;
			yMax = this.cursor.y ;
			xMinInline = 1 ;
			xMaxInline = this.cursor.x ;	// Erase the cursor's cell too
			break ;
		
		default :
			throw new Error( '.erase(): unknown type "' + type + '"' ) ;
			return ;
	}
	
	for ( y = yMin ; y <= yMax ; y ++ )
	{
		xMin = y === yMin ? xMinInline : 1 ;
		xMax = y === yMax ? xMaxInline : this.width ;
		
		for ( x = xMin ; x <= xMax ; x ++ )
		{
			// We should create a unique object for each cell
			this.state[ y - 1 ][ x - 1 ] = {
				char: ' ' ,
				fgColor: this.cursor.fgColor ,
				bgColor: this.cursor.bgColor
			} ;
			
			element = this.domContentTable.rows[ y - 1 ].cells[ x - 1 ].firstChild ;
			element.textContent = ' ' ;
			
			//console.log( 'attr: ' + this.cursor.classAttr ) ;
			element.setAttribute( 'class' , attrs.class ) ;
			element.setAttribute( 'style' , attrs.style ) ;
		}
	}
} ;



Terminal.prototype.delete = function delete_( n )
{
	var i , attrs , element ;
	
	if ( n === undefined ) { n = 1 ; }
	
	attrs = this.attrsFromObject( {
		fgColor: this.cursor.fgColor ,
		bgColor: this.cursor.bgColor
	} ) ;
	
	for ( i = 0 ; i < n ; i ++ )
	{
		// Delete the cell
		this.state[ this.cursor.y - 1 ].splice( this.cursor.x - 1 , 1 ) ;
		this.domContentTable.rows[ this.cursor.y - 1 ].deleteCell( this.cursor.x - 1 ) ;
		
		// Create a new empty cell at the end of the row
		// We should create a unique object for each cell
		this.state[ this.cursor.y - 1 ].push( {
			char: ' ' ,
			fgColor: this.cursor.fgColor ,
			bgColor: this.cursor.bgColor
		} ) ;
		
		element = document.createElement( 'div' ) ;
		element.textContent = ' ' ;
		element.setAttribute( 'class' , attrs.class ) ;
		element.setAttribute( 'style' , attrs.style ) ;
		this.domContentTable.rows[ this.cursor.y - 1 ].insertCell().appendChild( element ) ;
	}
} ;



Terminal.prototype.insert = function insert( n )
{
	var i , attrs , element ;
	
	if ( n === undefined ) { n = 1 ; }
	
	attrs = this.attrsFromObject( {
		fgColor: this.cursor.fgColor ,
		bgColor: this.cursor.bgColor
	} ) ;
	
	for ( i = 0 ; i < n ; i ++ )
	{
		// Delete the last cell
		this.state[ this.cursor.y - 1 ].pop() ;
		this.domContentTable.rows[ this.cursor.y - 1 ].deleteCell( -1 ) ;
		
		// Create a new empty cell at the cursor position
		// We should create a unique object for each cell
		this.state[ this.cursor.y - 1 ].splice( this.cursor.x - 1 , 0 , {
			char: ' ' ,
			fgColor: this.cursor.fgColor ,
			bgColor: this.cursor.bgColor
		} ) ;
		
		element = document.createElement( 'div' ) ;
		element.textContent = ' ' ;
		element.setAttribute( 'class' , attrs.class ) ;
		element.setAttribute( 'style' , attrs.style ) ;
		this.domContentTable.rows[ this.cursor.y - 1 ].insertCell( this.cursor.x - 1 ).appendChild( element ) ;
	}
} ;



Terminal.prototype.deleteLine = function deleteLine( n )
{
	var i , x , attrs , trElement , tdElement , divElement , lastStateRow ;
	
	if ( n === undefined ) { n = 1 ; }
	
	attrs = this.attrsFromObject( {
		fgColor: this.cursor.fgColor ,
		bgColor: this.cursor.bgColor
	} ) ;
	
	for ( i = 0 ; i < n ; i ++ )
	{
		// Delete the row
		this.state.splice( this.cursor.y - 1 , 1 ) ;
		this.domContentTable.deleteRow( this.cursor.y - 1 ) ;
		
		// Create a new row at the end of the table
		lastStateRow = this.state.length ;
		this.state[ lastStateRow ] = [] ;
		trElement = this.domContentTable.insertRow() ;
		
		for ( x = 1 ; x <= this.width ; x ++ )
		{
			// We should create a unique object for each cell
			this.state[ lastStateRow ][ x - 1 ] = {
				char: ' ' ,
				fgColor: this.cursor.fgColor ,
				bgColor: this.cursor.bgColor
			} ;
			
			divElement = document.createElement( 'div' ) ;
			divElement.setAttribute( 'class' , attrs.class ) ;
			divElement.setAttribute( 'style' , attrs.style ) ;
			tdElement = document.createElement( 'td' ) ;
			tdElement.appendChild( divElement ) ;
			trElement.appendChild( tdElement ) ;
		}
	}
} ;



Terminal.prototype.insertLine = function insertLine( n )
{
	var i , x , attrs , trElement , tdElement , divElement ;
	
	if ( n === undefined ) { n = 1 ; }
	
	attrs = this.attrsFromObject( {
		fgColor: this.cursor.fgColor ,
		bgColor: this.cursor.bgColor
	} ) ;
	
	for ( i = 0 ; i < n ; i ++ )
	{
		// Delete the last row
		this.state.pop() ;
		this.domContentTable.deleteRow( -1 ) ;
		
		// Create a new row where the cursor is
		this.state.splice( this.cursor.y - 1 , 0 , [] ) ;
		trElement = this.domContentTable.insertRow( this.cursor.y - 1 ) ;
		
		for ( x = 1 ; x <= this.width ; x ++ )
		{
			// We should create a unique object for each cell
			this.state[ this.cursor.y - 1 ][ x - 1 ] = {
				char: ' ' ,
				fgColor: this.cursor.fgColor ,
				bgColor: this.cursor.bgColor
			} ;
			
			divElement = document.createElement( 'div' ) ;
			divElement.setAttribute( 'class' , attrs.class ) ;
			divElement.setAttribute( 'style' , attrs.style ) ;
			tdElement = document.createElement( 'td' ) ;
			tdElement.appendChild( divElement ) ;
			trElement.appendChild( tdElement ) ;
		}
	}
} ;





			/* STDOUT parsing */



Terminal.prototype.onStdout = function onStdout( chunk )
{
	var i , j , buffer , startBuffer , char , codepoint ,
		keymapCode , keymapStartCode , keymap , keymapList ,
		regexp , matches , bytes , found , handlerResult ,
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
			console.error( 'Not implemented: ESC "' + char + '"' ) ;
			
			/*
			this.printChar( '\x1b' ) ;
			this.printChar( char ) ;
			//*/
			return 2 ;
	}
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
	var i , bytes , char , sequence = '' , index , num ;
	
	
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


