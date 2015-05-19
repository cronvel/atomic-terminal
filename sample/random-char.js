#!/usr/bin/env node


var thingsToWrite = [
	'a' , 'b' , 'c' , 'd' , 'e' , 'f' , 'g' , 'h' , 'i' , 'j' , 'k' , 'l' , 'm' ,
	'n' , 'o' , 'p' , 'q' , 'r' , 's' , 't' , 'u' , 'v' , 'w' , 'x' , 'y' , 'z' ,
	'0' , '1' , '2' , '3' , '4' , '5' , '6' , '7' , '8' , '9' ,
	' ' , ' ' , ' ' , ' ' , ' ' , ' ' ,
	'\n' , '\n' , '\n' ,
	
	// bold
	'\x1b[1m' , '\x1b[1m' , '\x1b[5m' , '\x1b[5m' ,
	'\x1b[22m' , '\x1b[22m' , '\x1b[22m' , '\x1b[22m' ,
] ;



function randomChar()
{
	process.stdout.write( thingsToWrite[ Math.floor( Math.random() * thingsToWrite.length ) ] ) ;
	
	setTimeout( randomChar , Math.random() * 500 ) ;
}

randomChar() ;

