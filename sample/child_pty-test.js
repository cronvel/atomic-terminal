#!/usr/bin/env node

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



// Create the object & export it
var processCom = {} ;



processCom.exec = function exec( command , args )
{
	if ( ! args ) { args = [] ; }
	
	console.log( command ) ;
	console.log( args ) ;
	
	var interface = spawn( command , args , { columns: 80 , rows: 24 } ) ;
	
	/*
	interface.stdout.on( 'data' , function( data ) {
		interface.emit( 'input' , data ) ;
	} ) ;
	
	interface.stderr.on( 'data', function( data ) {
		interface.emit( 'input' , data ) ;
	} ) ;
	
	interface.on( 'close', function( code ) {
		interface.emit( 'close' , code ) ;
	} ) ;
	*/
	
	return interface ;
} ;



var child = processCom.exec( process.argv[ 2 ] ) ;

child.stdout.on( 'data' , function( data ) {
	process.stdout.write( data ) ;
} ) ;

child.on( 'close' , function( data ) {
	process.exit() ;
} ) ;


