


// Load modules

// Module to control application life.
var app = require( 'app' ) ;

// Module to create native browser window.
var BrowserWindow = require( 'browser-window' ) ;

// Get the crash reporter
var crashReporter = require( 'crash-reporter' ) ;

// Processus communication
var processCom = require( './processCom.js' ) ;



// Start the crash reporter
crashReporter.start() ;



// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null ;



// Quit when all windows are closed.
app.on( 'window-all-closed' , function() {
	if ( process.platform !== 'darwin' )
	{
		app.quit() ;
	}
} ) ;



// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on( 'ready' , function() {
	
	// Create the browser window.
	mainWindow = new BrowserWindow( {
		width: 800 ,
		height: 600
	} ) ;
	
	// Open dev tools?
	if ( process.argv.indexOf( '--dev' ) !== -1 ) { mainWindow.openDevTools() ; }
	
	//console.log( process.argv ) ;
	mainWindow.command = { program: process.argv[ 2 ] , args: process.argv.slice( 3 ) } ;
	//mainWindow.processCom = processCom.exec( process.argv[ 2 ] , process.argv.slice( 3 ) ) ;
	
	// and load the index.html of the app.
	mainWindow.loadUrl( 'file://' + __dirname + '/front/terminal.html' ) ;
	
	// Emitted when the window is closed.
	mainWindow.on( 'closed' , function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null ;
	} ) ;
	
} ) ;


