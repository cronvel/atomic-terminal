var dom = {} ;
module.exports = dom ;


var type = {
	parent:'table',
	row:'tr',
	cell:'td'
} ;

dom.createFragments = function() {
	dom.cellFragment = document.createDocumentFragment() ;
	// var div = document.createElement( 'div' ) ;
	// div.className = 'fgColor' + this.defaultFgColorIndex + ' bgColor' + this.defaultBgColorIndex ;

	var cell = document.createElement( type.cell ) ;
	// cell.appendChild( div ) ;
	dom.cellFragment.appendChild( cell ) ;



	dom.rowFragment = document.createDocumentFragment() ;
	var row = document.createElement( type.row ) ;

	for ( var x = 1 ; x <= this.width ; x ++ )
	{
		row.appendChild( dom.cellFragment.cloneNode( true ) ) ;
	}

	dom.rowFragment.appendChild( row ) ;
} ;

dom.init = function() {
	dom.$main = document.createElement( type.parent ) ;
	dom.$main.id = 'contentTable' ;
	document.body.appendChild( dom.$main ) ;

	dom.createFragments.call( this ) ;
	dom.fill.call( this ) ;
} ;

dom.fill = function() {
	var fragment = document.createDocumentFragment() ;

	for ( var y = 1 ; y <= this.height ; y ++ )
	{
		this.state[ y - 1 ] = [] ;

		for ( var x = 1 ; x <= this.width ; x ++ )
		{
			this.state[ y - 1 ][ x - 1 ] = { char: ' ' } ;
		}

		fragment.appendChild( dom.rowFragment.cloneNode( true ) ) ;

	}
	dom.$main.className = 'fgColor' + 7 + ' bgColor' + 0 ;
	dom.$main.appendChild( fragment.cloneNode( true ) ) ;
} ;

dom.insertRow = function( y ) {
	if ( y === undefined ) {
		dom.deleteRow( 0 ) ;
	}
	else {
		dom.$main.removeChild( dom.$main.children[ -1 ] ) ;
		dom.$main.insertBefore( dom.rowFragment.cloneNode( true ) , dom.$main.children[ y ] ) ;
	}

} ;

dom.insertCell = function( x , y ) {
	var cell = dom.getCell( x , y ) ;
	var parentCell = cell.parentNode ;

	parentCell.insertBefore( dom.cellFragment.cloneNode( true ) , cell ) ;
	parentCell.removeChild( cell.parentNode.lastChild ) ;
} ;

dom.deleteRow = function( y ) {
	dom.$main.removeChild( dom.$main.children[ y ] ) ;
	dom.$main.appendChild( dom.rowFragment.cloneNode( true ) ) ;
} ;

dom.deleteCell = function( x , y ) {
	var cell = dom.getCell( x , y ) ;
	var parent = cell.parentNode ;
	parent.removeChild( cell ) ;

	parent.appendChild( dom.cellFragment.cloneNode( true ) ) ;
} ;

dom.setCell = function( x , y , attrs ) {
	var cell = dom.getCell( x , y ) ;
	if ( attrs.char ) cell.textContent = attrs.char ;
	if ( attrs.class ) cell.className = attrs.class ;
	if ( attrs.style ) cell.style = attrs.style ;
} ;

dom.getCell = function( x , y ) {
	return dom.$main.children[ y ].children[ x ] ;
} ;
