

// It appears that the current directory path is the HTML's directory...
// It's only true for files loaded directly via a <script> tag in the HTML... 
// That's a supa feature...
var Terminal = require( './js/Terminal.js' ) ;
var dom = require( 'dom-kit' ) ;



var terminal ;



dom.ready( function() {
	
	terminal = Terminal.create() ;
	terminal.start() ;
} ) ;




