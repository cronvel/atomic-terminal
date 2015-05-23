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



// Modules
//var spawn = require( 'child_process' ).spawn ;
var spawn = require( 'child_pty' ).spawn ;
var events = require( 'events' ) ;
var tree = require( 'tree-kit' ) ;



/*
	Important notice: child_pty does not work correctly in the renderer process!!!
	Data can be lost.
	So it should be run in the browser process.
*/



function ChildProcess() { throw new Error( '[ChildProcess] use ChildProcess.create() instead' ) ; }
ChildProcess.prototype = Object.create( events.EventEmitter.prototype ) ;
ChildProcess.prototype.constructor = ChildProcess ;

module.exports = ChildProcess ;



ChildProcess.create = function create( command , args )
{
	var child = Object.create( ChildProcess.prototype ) ;
	
	child.command = command ;
	child.args = args || [] ;
	
	return child ;
} ;



ChildProcess.prototype.run = function run()
{
	var self = this ;
	
	this.child = spawn( this.command , this.args , {
		env: tree.extend( null , {} , process.env , {
			TERM: 'xterm-256color' ,
			COLORTERM: 'atomic-terminal'
		} ) ,
		columns: 80 ,
		rows: 24
	} ) ;
	
	this.child.stdout.on( 'data' , function( data ) {
		
		//process.stdout.write( data ) ;
		
		// Remote Buffer are slow and for some reason, a renderer listener can get data in the bad order...
		// So everything is converted to ascii to ensure that all data are sent immediately.
		// Remote Buffer does not contains data, only accessors (via IPC) and that sucks big time.
		
		//self.emit( 'output' , data ) ;
		self.emit( 'output' , data.toString( 'ascii' ) ) ;
	} ) ;
	
	/*
	// child_pty does not provide any stderr
	this.child.stderr.on( 'data', function( data ) {
		self.emit( 'output' , data ) ;
	} ) ;
	//*/
	
	this.child.on( 'close', function( code ) {
		self.emit( 'close' , code ) ;
	} ) ;
	
	return this.child ;
} ;



