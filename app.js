


// Load modules

// Module to control application life.
var app = require( 'app' ) ;

// Module to create native browser window.
var BrowserWindow = require( 'browser-window' ) ;

// Get the crash reporter
var crashReporter = require( 'crash-reporter' ) ;

// Processus communication
var ChildProcess = require( './ChildProcess.js' ) ;

// Safely set the process' title from the package name
process.title = require( './package.json' ).name ;



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



var argPos , devTools = false , args = process.argv.slice() ;

// Open dev tools?
if ( ( argPos = args.indexOf( '--dev' ) ) !== -1 )
{
	args.splice( argPos , 1 ) ;
	devTools = true ;
}


// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on( 'ready' , function() {
	
	// Create the browser window.
	mainWindow = new BrowserWindow( {
		width: 830 ,
		height: 480
	} ) ;
	
	// Open dev tools?
	if ( devTools ) { mainWindow.openDevTools() ; }
	
	mainWindow.command = { path: args[ 2 ] , args: args.slice( 3 ) } ;
	mainWindow.childProcess = ChildProcess.create( args[ 2 ] , args.slice( 3 ) ) ;
	
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


