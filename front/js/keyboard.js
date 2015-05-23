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



keyboard.onKeyDown = function onKeyDown( event )
{
	var keyCode = event.keyCode ;
	var keyChar = String.fromCharCode( keyCode ) ;
	
	switch( keyCode )
	{
		case 16:
		case 17:
		case 18:
			// shift, ctrl, alt: do nothing
		case 225:
			keyboard.altgr = true ;
			break ;
		
		default :
			console.log( "Key pressed " +
				( event.shiftKey ? 'Shift+' : '' ) +
				( event.ctrlKey ? 'Ctrl+' : '' ) +
				( event.altKey ? 'Alt+' : '' ) +
				( event.metaKey ? 'Meta+' : '' ) +
				keyChar +
				' [' + keyCode + ']'
			) ;
			this.remoteWin.childProcess.input( keyChar ) ;
			break ;
	}
} ;



keyboard.onKeyUp = function onKeyUp( event )
{
	var key = event.keyCode || event.which ;
	var keychar = String.fromCharCode( key ) ;
	
	switch( key )
	{
		case 225:
			keyboard.altgr = false ;
			break ;
	}
} ;


