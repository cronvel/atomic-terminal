#!/usr/bin/env node

var count = process.argv[ 2 ] || 10 ;

process.stdout.write( 'Starting echo.js...' ) ;

try {
	process.stdin.setRawMode( true ) ;
}
catch ( error ) {
	console.log( 'Not a TTY' ) ;
}

process.stdin.on( 'data' , function( data ) {
	
	console.log( 'Count #' , count , ':' , data ) ;
	
	if ( count <= 0 )
	{
		process.stdout.write( 'Exiting...' ) ;
		process.exit() ;
	}
	
	process.stdout.write( data ) ;
	count -- ;
} ) ;
