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



var keyboard = {} ;
module.exports = keyboard ;



// Should I use keypressed event instead?

keyboard.onKeyDown = function onKeyDown( event )
{
	//console.log( string.inspect( { style: 'color' , depth: 1 } , event ) ) ;
	var keyCode = event.keyCode ;
	var key ;

	switch( keyCode )
	{
		case 16:
		case 17:
		case 18:
		case 225:
			// shift, ctrl, alt, altgr: do nothing when those key are pressed alone
			break ;

		// BACKSPACE
		case 8:
			if ( event.shiftKey ) { key = '\x08' ; }	// backspace / shift backspace
			else { key = '\x7f' ; }
			break ;

		// TAB
		case 9:
			if ( event.shiftKey ) { key = '\x1b[Z' ; }
			else if ( event.altKey ) { key = '\x1b\x09' ; }
			else { key = '\x09' ; }
			break ;

		// ENTER / RETURN
		case 13:
			key = '\x0d' ;
			break ;

		// ESCAPE
		case 27:
			key = '\x1b' ;
			break ;

		case 32:
			if ( event.ctrlKey && event.altKey ) { key = '\x1b\x00' ; }	// ESC NUL
			else if ( event.ctrlKey ) { key = '\x00' ; }	// NUL
			else if ( event.altKey ) { key = '\x1b ' ; }	// ESC SPACE
			break ;

		// PAGE UP
		case 33:
			key = '\x1b[5~' ;
			break ;

		// PAGE DOWN
		case 34:
			key = '\x1b[6~' ;
			break ;

		// END
		case 35:
			key = '\x1b[4~' ;
			break ;

		// HOME
		case 36:
			key = '\x1b[1~' ;
			break ;

		// LEFT
		case 37:
			if ( event.shiftKey ) { key = '\x1b[1;2D' ; }
			else if ( event.altKey ) { key = '\x1b[1;3D' ; }
			else if ( event.ctrlKey ) { key = '\x1b[1;5D' ; }
			else { key = '\x1b[D' ; }
			break ;

		// UP
		case 38:
			if ( event.shiftKey ) { key = '\x1b[1;2A' ; }
			else if ( event.altKey ) { key = '\x1b[1;3A' ; }
			else if ( event.ctrlKey ) { key = '\x1b[1;5A' ; }
			else { key = '\x1b[A' ; }
			break ;

		// RIGHT
		case 39:
			if ( event.shiftKey ) { key = '\x1b[1;2C' ; }
			else if ( event.altKey ) { key = '\x1b[1;3C' ; }
			else if ( event.ctrlKey ) { key = '\x1b[1;5C' ; }
			else { key = '\x1b[C' ; }
			break ;

		// DOWN
		case 40:
			if ( event.shiftKey ) { key = '\x1b[1;2B' ; }
			else if ( event.altKey ) { key = '\x1b[1;3B' ; }
			else if ( event.ctrlKey ) { key = '\x1b[1;5B' ; }
			else { key = '\x1b[B' ; }
			break ;

		// INSERT
		case 45:
			if ( event.altKey ) { key = '\x1b[2;3~' ; }
			else { key = '\x1b[2~' ; }
			break ;

		// DELETE
		case 46:
			if ( event.altKey ) { key = '\x1b[3;3~' ; }
			else { key = '\x1b[3~' ; }
			break ;

		// F1
		case 112:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1bO1;6P' ; }
			else if ( event.shiftKey ) { key = '\x1bO1;2P' ; }
			else if ( event.ctrlKey ) { key = '\x1bO1;5P' ; }
			else { key = '\x1bOP' ; }
			break ;

		// F2
		case 113:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1bO1;6Q' ; }
			else if ( event.shiftKey ) { key = '\x1bO1;2Q' ; }
			else if ( event.ctrlKey ) { key = '\x1bO1;5Q' ; }
			else { key = '\x1bOQ' ; }
			break ;

		// F3
		case 114:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1bO1;6R' ; }
			else if ( event.shiftKey ) { key = '\x1bO1;2R' ; }
			else if ( event.ctrlKey ) { key = '\x1bO1;5R' ; }
			else { key = '\x1bOR' ; }
			break ;

		// F4
		case 115:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1bO1;6S' ; }
			else if ( event.shiftKey ) { key = '\x1bO1;2S' ; }
			else if ( event.ctrlKey ) { key = '\x1bO1;5S' ; }
			else { key = '\x1bOS' ; }
			break ;

		// F5
		case 116:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1b[15;6~' ; }
			else if ( event.shiftKey ) { key = '\x1b[15;2~' ; }
			else if ( event.ctrlKey ) { key = '\x1b[15;5~' ; }
			else { key = '\x1b[15~' ; }
			break ;

		// F6
		case 117:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1b[17;6~' ; }
			else if ( event.shiftKey ) { key = '\x1b[17;2~' ; }
			else if ( event.ctrlKey ) { key = '\x1b[17;5~' ; }
			else { key = '\x1b[17~' ; }
			break ;

		// F7
		case 118:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1b[18;6~' ; }
			else if ( event.shiftKey ) { key = '\x1b[18;2~' ; }
			else if ( event.ctrlKey ) { key = '\x1b[18;5~' ; }
			else { key = '\x1b[18~' ; }
			break ;

		// F8
		case 119:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1b[19;6~' ; }
			else if ( event.shiftKey ) { key = '\x1b[19;2~' ; }
			else if ( event.ctrlKey ) { key = '\x1b[19;5~' ; }
			else { key = '\x1b[19~' ; }
			break ;

		// F9
		case 120:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1b[20;6~' ; }
			else if ( event.shiftKey ) { key = '\x1b[20;2~' ; }
			else if ( event.ctrlKey ) { key = '\x1b[20;5~' ; }
			else { key = '\x1b[20~' ; }
			break ;

		// F10
		case 121:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1b[21;6~' ; }
			else if ( event.shiftKey ) { key = '\x1b[21;2~' ; }
			else if ( event.ctrlKey ) { key = '\x1b[21;5~' ; }
			else { key = '\x1b[21~' ; }
			break ;

		// F11
		case 122:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1b[23;6~' ; }
			else if ( event.shiftKey ) { key = '\x1b[23;2~' ; }
			else if ( event.ctrlKey ) { key = '\x1b[23;5~' ; }
			else { key = '\x1b[23~' ; }
			break ;

		// F12
		case 123:
			if ( event.shiftKey && event.ctrlKey ) { key = '\x1b[24;6~' ; }
			else if ( event.shiftKey ) { key = '\x1b[24;2~' ; }
			else if ( event.ctrlKey ) { key = '\x1b[24;5~' ; }
			else { key = '\x1b[24~' ; }
			break ;

		// Caret, etc
		case 229:
			if ( event.shiftKey ) { key = '¨' ; }
			else { key = '^' ; }
			break ;

		default :

			if ( event.ctrlKey )
			{
				if ( keyCode >= 65 && keyCode <= 90 )
				{
					// CTRL + [A-Z] or CTRL + ALT + [A-Z]
					key = ( event.altKey ? '\x1b' : '' ) + String.fromCharCode( keyCode - 64 ) ;
				}
			}
			else if ( event.altKey || event.metaKey )
			{
				if ( keyCode >= 65 && keyCode <= 90 )
				{
					// ALT + [A-Z] or ALT + SHIFT + [A-Z]
					key = '\x1b' + String.fromCharCode( keyCode + ( event.shiftKey ? 0 : 32 ) ) ;
				}
			}

			/*
			console.log( "keydown: " +
				( event.shiftKey ? 'Shift+' : '' ) +
				( event.ctrlKey ? 'Ctrl+' : '' ) +
				( event.altKey ? 'Alt+' : '' ) +
				( event.metaKey ? 'Meta+' : '' ) +
				keyChar +
				' [' + keyCode + ']'
			) ;
			//*/
			break ;
	}

	// We should NOT return false here: it would prevent the 'keypress' event from firing
	if ( key === undefined ) { return ; }

	event.preventDefault() ;
	//event.stopPropagation() ;

	this.remoteWin.childProcess.input( key ) ;

	// Important
	return false ;
} ;



keyboard.onKeyPress = function( event )
{
	var keyCode = event.keyCode ;
	var keyChar = String.fromCharCode( keyCode ) ;
	//console.log( string.inspect( { style: 'color' , depth: 1 } , event ) ) ;

	// In those case, let onKeyDown handle things
	if ( keyCode < 0x20 || keyCode === 0x7f || event.ctrlKey || event.altKey || event.metaKey ) { return false ; }

	// So we have got a regular character, just emit it

	event.preventDefault() ;
	//event.stopPropagation() ;

	/*
	console.log( "keypress: " +
		keyChar +
		' [' + keyCode + '][' +
		( event.shiftKey ? ' Shift ' : '' ) +
		( event.ctrlKey ? ' Ctrl ' : '' ) +
		( event.altKey ? ' Alt ' : '' ) +
		( event.metaKey ? ' Meta ' : '' ) +
		']'
	) ;
	//*/

	this.remoteWin.childProcess.input( keyChar ) ;
	//console.log( 'input keyChar: "' + keyChar + '"' ) ;

	// Important
	return false;
} ;
