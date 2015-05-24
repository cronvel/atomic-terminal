#!/usr/bin/env node

var ChildProcess = require( '../ChildProcess.js' ) ;


//var child = ChildProcess.create( process.argv[ 2 ] , process.argv.slice( 3 ) ) ;
var child = ChildProcess.create( process.argv[ 2 ] , process.argv.slice( 3 ) , require( 'child_pty' ).spawn ) ;
//var child = ChildProcess.create( process.argv[ 2 ] , process.argv.slice( 3 ) , require( 'child_process' ).spawn ) ;

child.run() ;

child.on( 'close' , function() {
	console.log( 'Child closed...' ) ;
	process.exit() ;
} ) ;

child.on( 'output' , function( data ) {
	console.log( 'Received: "' + data.toString() + '"' ) ;
} ) ;

var count = 0 ;

function send()
{
	var string ;
	string = String.fromCharCode( 65 + Math.floor( Math.random() * 20 ) ) ;
	if ( ! ( count % 5 ) ) { string += '\n' ; }
	console.log( 'Sending: "' + string + '"' ) ;
	child.input( string ) ;
	count ++ ;
	setTimeout( send , 100 ) ;
}

setTimeout( send , 100 ) ;



