var dom = {} ;
module.exports = dom ;


var type = {
	parent:'table',
	row:'tr',
	cell:'td'
} ;


/*
	TODO:
	- Set the size of the terminal by dom

	- Set css in this file

	- Change the cursor to not have to restore cell
		after his passage but just have an overriding css class to remove


	- Terminal.prototype.insertLine and Terminal.prototype.deleteLine
		share big chunk of code : refactor!
		THE SAME FOR insert and delete


	??? In the internal state, if the cell is default, use a reference to link it's property
		BUT BE careful, don't modify this object directly, when modifiyng a default, always
		create a new object
*/


// ref to the main Terminal object, set in dom.init
var Terminal ;


dom.cellFragment = {} ;
dom.rowFragment = {} ;

dom.createFragments = function() {
	dom.$main = document.createElement( type.parent ) ;
	dom.$main.id = 'contentTable' ;
	document.body.appendChild( dom.$main ) ;


	dom.cellFragment = document.createDocumentFragment() ;
	// var div = document.createElement( 'div' ) ;
	// div.className = 'fgColor' + this.defaultFgColorIndex + ' bgColor' + this.defaultBgColorIndex ;

	var cell = document.createElement( type.cell ) ;
	// cell.appendChild( div ) ;
	dom.cellFragment.appendChild( cell ) ;



	dom.rowFragment = document.createDocumentFragment() ;
	var row = document.createElement( type.row ) ;

	for ( var x = 1 ; x <= Terminal.width ; x ++ )
	{
		row.appendChild( dom.cellFragment.cloneNode( true ) ) ;
	}

	dom.rowFragment.appendChild( row ) ;
} ;

dom.cellArray = function() {
	return {
		char: ' ' ,
		fgColor: Terminal.cursor.fgColor ,
		bgColor: Terminal.cursor.bgColor
	} ;
} ;
dom.rowArray = function() {
	var arr = [] ;

	for ( var x = 1 ; x <= Terminal.width ; x ++ )
	{
		arr.push( dom.cellArray ) ;
	}
	return arr ;
} ;

dom.init = function( terminal ) {
	Terminal = terminal ;

	dom.createFragments() ;
	dom.fill() ;
	dom.events() ;
} ;


dom.events = function() {
	return;

	// next use this function to set events
	dom.$main.addEventListener( 'keydown' , Terminal.keyboard.onKeyDown.bind( Terminal ) , false ) ;
	dom.$main.addEventListener( 'keypress' , Terminal.keyboard.onKeyPress.bind( Terminal ) , false ) ;
} ;


dom.fill = function() {
	var fragment = document.createDocumentFragment() ;

	for ( var y = 1 ; y <= Terminal.height ; y ++ )
	{
		Terminal.state.push( dom.rowArray() ) ;
		fragment.appendChild( dom.rowFragment.cloneNode( true ) ) ;
	}
	dom.$main.className = 'fgColor' + Terminal.defaultFgColorIndex + ' bgColor' + Terminal.defaultBgColorIndex ;
	dom.$main.appendChild( fragment.cloneNode( true ) ) ;
} ;

dom.insertRow = function( y ) {
	if ( y === undefined ) {
		dom.deleteRow( 0 ) ;
	}
	else {
		dom.$main.removeChild( dom.$main.children[ -1 ] ) ;
		dom.$main.insertBefore( dom.rowFragment.cloneNode( true ) , dom.$main.children[ y ] ) ;

		Terminal.state.pop() ;
		Terminal.state.splice( y , 0 , dom.rowArray() ) ;
	}
} ;

dom.insertCell = function( x , y ) {
	/* insertCell cree une cellule, sans setter de default */
	var cell = dom.getCell( x , y ) ;
	var parentCell = cell.parentNode ;

	parentCell.insertBefore( dom.cellFragment.cloneNode( true ) , cell ) ;
	parentCell.removeChild( cell.parentNode.lastChild ) ;

	Terminal.state[ y ].pop() ;
	Terminal.state[ y ].splice( x , 0 , dom.cellArray() ) ;
} ;


dom.deleteRow = function( y ) {
	dom.$main.removeChild( dom.$main.children[ y ] ) ;
	dom.$main.appendChild( dom.rowFragment.cloneNode( true ) ) ;

	Terminal.state.splice( y , 1 ) ;
	Terminal.state.push( dom.rowArray() ) ;
} ;

dom.deleteCell = function( x , y ) {
	var cell = dom.getCell( x , y ) ;
	var parent = cell.parentNode ;
	parent.removeChild( cell ) ;

	parent.appendChild( dom.cellFragment.cloneNode( true ) ) ;

	Terminal.state[ y ].splice( x , 1 ) ;
	Terminal.state[ y ].push( dom.cellArray() ) ;
} ;

dom.setCursor = function( x , y , attrs ) {
	dom.setCell( x , y , false , attrs ) ;
} ;

// If attrs is not an object, attrs is just a char,
// and fgColor, bgColor are set by default
dom.setCell = function( x , y , char , attrs ) {
	var cell = dom.getCell( x , y ) ;

	if ( char ) {
		cell.textContent = char ;
	}

	// need to change this in the futur,
	// just set the needed class, not allways fgColor & bgColor
	if ( attrs.class ) {
	// if ( attrs.class && ( Terminal.cursor.fgColor !== false || Terminal.cursor.bgColor !== false )  ) {
		cell.className = attrs.class ;
	}

	if ( attrs.style ) {
		cell.style = attrs.style ;
	}

	// Update the internal state
	Terminal.state[ y ][ x ] = {
		char: char ,
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
