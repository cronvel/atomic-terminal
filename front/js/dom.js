/*
	TODO:
	- add a nice font

	- Paste with ctrl-v add a strange char at the end (on visible after backspace)
		work great with middle click

	- Set the size of the terminal by dom

	- Optimise Terminal.prototype.attrsFromObject: too many recompile due to type change

	- Set css in this file
*/

var dom = {} ;
module.exports = dom ;

// ref to the main Terminal object, set in dom.init
var Terminal ;
var keyboard = require( './keyboard.js' ) ;

var type = {
	parent:'div',
	row:'div',
	cell:'span'
} ;


/* ************** */
/* Init functions */
/* ************** */

dom.init = function( terminal ) {
	Terminal = terminal ;

	terminal.terminalStyle() ;

	dom.createLayout() ;
	dom.events() ;

	css.initCursor() ;
} ;

dom.createLayout = function() {
	dom.$main = document.createElement( type.parent ) ;
	dom.$main.id = 'contentTable' ;
	dom.$main.className = 'fgColor' + Terminal.defaultFgColorIndex + ' bgColor' + Terminal.defaultBgColorIndex ;
	dom.$main.appendChild( fragments.full() ) ;
	document.body.appendChild( dom.$main ) ;
} ;

dom.events = function() {
	document.addEventListener( 'keydown' , keyboard.onKeyDown.bind( Terminal ) , false ) ;
	document.addEventListener( 'keypress' , keyboard.onKeyPress.bind( Terminal ) , false ) ;
	document.addEventListener( 'paste' , keyboard.onPaste.bind( Terminal ) , false ) ;
} ;

/* ************** */
/* Main functions */
/* ************** */

dom.insertRow = function( y ) {
	if ( y === undefined ) {
		dom.deleteRow( 0 ) ;
	}
	else {
		dom.$main.removeChild( dom.$main.children[ -1 ] ) ;
		dom.$main.insertBefore( fragments.row() , dom.$main.children[ y ] ) ;

		Terminal.state.pop() ;
		Terminal.state.splice( y , 0 , dom.rowArray() ) ;
	}
} ;

dom.insertCell = function( x , y ) {
	var cell = dom.getCell( x , y ) ,
		parentCell = cell.parentNode ;

	parentCell.insertBefore( fragments.cell() , cell ) ;
	parentCell.removeChild( cell.parentNode.lastChild ) ;

	Terminal.state[ y ].pop() ;
	Terminal.state[ y ].splice( x , 0 , dom.cellArray() ) ;
} ;


dom.deleteRow = function( y ) {
	dom.$main.removeChild( dom.$main.children[ y ] ) ;
	dom.$main.appendChild( fragments.row() ) ;

	Terminal.state.splice( y , 1 ) ;
	Terminal.state.push( dom.rowArray() ) ;
} ;

dom.deleteCell = function( x , y ) {
	var cell = dom.getCell( x , y ) ,
		parent = cell.parentNode ;

	parent.removeChild( cell ) ;
	parent.appendChild( fragments.cell() ) ;

	Terminal.state[ y ].splice( x , 1 ) ;
	Terminal.state[ y ].push( dom.cellArray() ) ;
} ;

dom.setCell = function( x , y , char , attrs ) {
	var state = Terminal.state[ y ][ x ] ,
		cell = dom.getCell( x , y ) ;

	if ( attrs.class !== state.class ) {
		cell.className = attrs.class ;
	}

	if ( char ) {
	// if ( char !== state.char ) {
		cell.textContent = char ;
	}

	if ( attrs.style ) {
		cell.style = attrs.style ;
	}

	if ( debug.state ) {
		if ( attrs.class !== state.class || char ) {
			debug.cell( cell , 'cell' ) ;
		}

	}

	// Update the internal state
	Terminal.state[ y ][ x ] = {
		char: char ,
		class: attrs.class ,

		fgColor: Terminal.cursor.fgColor ,
		bgColor: Terminal.cursor.bgColor ,
		bold: Terminal.cursor.bold ,
		dim: Terminal.cursor.dim ,
		italic: Terminal.cursor.italic ,
		underline: Terminal.cursor.underline ,
		blink: Terminal.cursor.blink ,
		inverse: Terminal.cursor.inverse ,
		hidden: Terminal.cursor.hidden ,
		strike: Terminal.cursor.strike
	} ;
} ;

dom.getCell = function( x , y ) {
	return dom.$main.children[ y ].children[ x ] ;
} ;

dom.cursor = false ;
dom.setCursor = function( x , y ) {
	var cell = dom.getCell( x , y ) ,
		state = Terminal.state[ y ][ x ] ;

	if ( dom.cursor ) {
		dom.cursor.classList.remove('cursor') ;
	}
	dom.cursor = cell ;
	cell.classList.add('cursor') ;
	css.setCursor( state.fgColor || Terminal.defaultFgColorIndex , state.bgColor || Terminal.defaultBgColorIndex ) ;
} ;

dom.hideCursor = function() {
	if ( dom.cursor ) {
		dom.cursor.classList.remove('cursor') ;
	}
} ;


/* **************************** */
/* "Need to be moved" functions */
/* **************************** */

dom.cellArray = function() {
	return {
		char: ' ' ,
		fgColor: Terminal.cursor.fgColor ,
		bgColor: Terminal.cursor.bgColor
	} ;
} ;
dom.rowArray = function() {
	var arr = [] ;

	for ( var x = 1 ; x <= Terminal.width ; x ++ ) {
		arr.push( dom.cellArray() ) ;
	}
	return arr ;
} ;


/* *********** */
/* CSS related */
/* *********** */

var css = {} ;

css.cursor = {
	stylesheet: {} ,
	color:'',
	backgroundColor:''
} ;

css.initCursor = function() {
	var styleEl = document.createElement('style') ;

	document.head.appendChild(styleEl);

	css.cursor.stylesheet = styleEl.sheet;

	css.cursor.stylesheet.insertRule( '.cursor { color:#000;  }' , 0 ) ;
	css.cursor.stylesheet.insertRule( '@-webkit-keyframes blink { 50%  { background-color:#000 ; color:rgb(170,170,170) ; } }' , 1 ) ;
} ;


css.setCursor = function( color , backgroundColor ) {
	if ( color !== css.cursor.color ) {
		css.cursor.color = color ;
		color = 'rgb(' + Terminal.palette[ color ].r +','+ Terminal.palette[ color ].g +','+ Terminal.palette[ color ].b + ')';

		css.cursor.stylesheet.cssRules[0].style.backgroundColor = color ;
		css.cursor.stylesheet.cssRules[1].cssRules[0].style.color = color ;
	}
	if ( backgroundColor !== css.cursor.backgroundColor ) {
		css.cursor.backgroundColor = backgroundColor ;
		backgroundColor = 'rgb(' + Terminal.palette[ backgroundColor ].r +','+ Terminal.palette[ backgroundColor ].g +','+ Terminal.palette[ backgroundColor ].b + ')';

		css.cursor.stylesheet.cssRules[0].style.color = backgroundColor ;
		css.cursor.stylesheet.cssRules[1].cssRules[0].style.backgroundColor = backgroundColor ;
	}
} ;



/* **************************** */
/* Fragments used in the layout */
/* **************************** */

var fragments = {
	cachedFull: false ,
	cachedRow: false ,
	cachedCell: false ,

	reset: function() {
		this.cachedFull = false ;
		this.cachedRow = false ;
		this.cachedCell = false ;
	} ,

	full: function() {
		if ( ! this.cachedFull ) {
			this.cachedFull = document.createDocumentFragment() ;

			for ( var y = 1 ; y <= Terminal.height ; y ++ )	{
				Terminal.state.push( dom.rowArray() ) ;
				this.cachedFull.appendChild( this.row() ) ;
			}
		}

		return this.cachedFull.cloneNode( true ) ;
	} ,

	row: function() {
		if ( ! this.cachedRow ) {
			this.cachedRow = document.createDocumentFragment() ;
			var row = document.createElement( type.row ) ;

			for ( var x = 1 ; x <= Terminal.width ; x ++ ) {
				row.appendChild( this.cell() ) ;
			}

			this.cachedRow.appendChild( row ) ;
		}

		var clone = this.cachedRow.cloneNode( true ) ;

		if ( debug.state ) {
			clone.setAttribute('data-debug','new') ;
		}
		return clone ;
	} ,

	cell: function() {
		if ( ! this.cachedCell ) {
			this.cachedCell = document.createDocumentFragment() ;

			var cell = document.createElement( type.cell ) ;
			this.cachedCell.appendChild( cell ) ;
		}

		var clone = this.cachedCell.cloneNode( true ) ;

		if ( debug.state ) {
			clone.setAttribute('data-debug','new') ;
		}
		return clone ;
	}
} ;


var debug = {
	state:false,
	cell: function( cell , value ) {
		cell.removeAttribute('data-debug' ) ;

		// to trigger new the animation
		setTimeout( function() {
			cell.setAttribute('data-debug',value ) ;
		} , 0 ) ;
	}
} ;
