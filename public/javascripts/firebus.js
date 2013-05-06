var buses = { };
var routeMarkers = {};
var map;
var routeMods = {
	'100': {color:'0F6AAC', text: 'MAX'},
	'190': {color:'FFC524', text: 'MAX'},
	'200': {color:'028953', text: 'MAX'},
	'193': {color:'000000',  text: 'SC'},
	'194': {color:'000000',  text: 'SC'},
	'90': {color:'D31F43', text:'MAX'},
	'921': {color:'F54B00', text: 'G'},
	'922': {color:'F54B00', text: 'G'}
};

function initialize() {
	var mapOptions = {
	center: new google.maps.LatLng(45.525292,-122.668197),
	zoom: 13,
	mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	var transitLayer = new google.maps.TransitLayer();
	transitLayer.setMap(map);
}

var d = new Date();

var f = new Firebase("https://livemet.firebaseio.com/routes");
function newBus(bus) {
    var busLatLng = new google.maps.LatLng(bus.lat, bus.lon),
    directionColor = "7094FF",
    routeText = bus.route,
    busID = bus.busID,
    destination = bus.destination;
    //SET BUS INFO HERE
    buses[busID] = {};

    buses[busID].info = bus;

    if (routeMods[bus.route])
    {
    	directionColor = routeMods[routeText].color;
    	routeText = routeMods[routeText].text;
    }
    var marker = new google.maps.Marker({ icon: 'http://chart.googleapis.com/chart?chst=d_bubble_text_small&chld=bbT|'+routeText+'|' + directionColor + '|eee', position: busLatLng, map: map });


	var  block = '<br>Block:' + buses[busID].info.block || '';
	var content = 'Route: ' + buses[busID].info.route + '<br>Vehicle #: ' + busID +  block + '<br>' + buses[busID].info.destination;
    var infowindow = new google.maps.InfoWindow({content: content,position: busLatLng});
	
	buses[busID].contentWindow = infowindow;
	//buses[busID].contentWindow.setContent(content);
   
    google.maps.event.addListener(marker, 'click', function()
    {
    	buses[busID].contentWindow.open(map);
    });

    google.maps.event.addListener(marker, 'mouseover', function()
    {

    });
    google.maps.event.addListener(marker, 'mouseout', function()
    {

    })
    buses[busID].marker = marker;
}


var filter = (function() {

	var eSearch = document.getElementById('search'),
	eClear = document.getElementById('clear'),
	showBuses = {},
	currentBuses = {};

	function init()
	{
		eClear.addEventListener('click', clear);
		eSearch.addEventListener('keyup', applyFilter);
	}

	function applyFilter(e)
	{
		var busList = filter.getCurrentBuses(),
		query = filter.getSearch().value;
		if (query.length === 0)
		{
			for(bus in busList)
			{
				filter.setBus(bus,true);
				busList[bus].marker.setVisible(true);
			}
			return false;
		}

		for(bus in busList)
		{
			var param = busList[bus].info;
			if (param.route == query || param.busID == query || param.block == query)
			{
				filter.setBus(bus,true);
				busList[bus].marker.setVisible(true);
			}
			else
			{
				filter.setBus(bus,false);
				busList[bus].marker.setVisible(false);
			}
		}
	}

	function clear(e)
	{
		filter.clearSearch();
		filter.applyFilter();
		e.preventDefault();
	}

	function getSearch()
	{
		return eSearch;
	}

	function clearSearch() {
		eSearch.value = '';
	}

	function getBuses() 
	{
		return showBuses;
	}
	function getCurrentBuses()
	{
		return currentBuses;
	}
	function setBus(bus, toggle)
	{
	 	if (showBuses[bus] === 'undefined')
	 	{
	 		showBuses[bus] = {};
	 	}
	 	showBuses[bus] = toggle;
	}
	function setBuses(buses)
	{
		currentBuses = buses;
	}
	return {
		init:init,
		clearSearch: clearSearch,
		getBuses: getBuses,
		setBuses: setBuses,
		getCurrentBuses: getCurrentBuses,
		setBus: setBus,
		getSearch: getSearch,
		applyFilter: applyFilter
	}
}());

filter.init();

f.once("value", function(s) {
  s.forEach(function(b) {
	var name = b.name();
	newBus(b.val());
  });
  filter.setBuses(buses);
});

f.on("child_changed", function(s) {
	var name = s.name(),
	busMarker = buses[name].marker;
	if (typeof busMarker === 'undefined')
	{
		newBus(s.val());
	} 
	else
	{
		buses[name].info = s.val();
		if (buses[name].contentWindow)
		{
			var  block = '<br>Block:' + s.val().block || '';
			var content = 'Route: ' + s.val().route + '<br>Vehicle #: ' + name + block + '<br>' + s.val().destination,
			infoPosition = new google.maps.LatLng(s.val().lat, s.val().lon);
			//buses[name].contentWindow.setPosition(infoPosition);
			buses[name].contentWindow.setContent(content);
			buses[name].contentWindow.animatedMoveTo(s.val().lat, s.val().lon);
		}
		//UPDATE MARKER ICON IF BUS ROUTE CHANGES
		var routeText = s.val().route,
		directionColor = '7094FF';
		if (routeMods[s.val().route])
	    {
	    	directionColor = routeMods[routeText].color;
	    	routeText = routeMods[routeText].text;
	    }
		busMarker.setIcon('http://chart.googleapis.com/chart?chst=d_bubble_text_small&chld=bbT|'+routeText+'|' + directionColor + '|eee');
		busMarker.animatedMoveTo(s.val().lat,s.val().lon);
	}

	filter.setBuses(buses);
});

f.on("child_removed", function(s) {
	var name = s.name(),
	busMarker = buses[name].marker,
	infoWindow = buses[name].contentWindow;

	if (typeof busMarker !== 'undefined') {
		busMarker.setMap(null);
		if (infoWindow)
		{
			infoWindow.setMap(null);
		}
		//Probably shouldn't delete, just need to splice it out for GC to work
		delete buses[name];
	}
});

var about = (function(toggleid, id)
{
	var eToggle = document.getElementById(toggleid),
	eShow = document.getElementById(id);
	function init()
	{
		var children = eShow.children,
		childrenLength = children.length;
		eShow.style.display = 'none';
		eToggle.addEventListener('click', toggle);
		for(var i = 0; i < childrenLength; i++) {
			if (children[i].className.indexOf('close') !== -1)
			{
				children[i].addEventListener('click', toggle);
				break;
			}
		}
	}

	function toggle(e)
	{
		about.setStyle((about.getHidden() ? 'block' : 'none'));
		e.preventDefault();
	}
	function getHidden()
	{
		return eShow.style.display === 'none' ? true : false;
	}
	function setStyle(style)
	{
		eShow.style.display = style;
	}

	return {
		init: init,
		getHidden: getHidden,
		setStyle: setStyle
	}
}('abouttog','about'));
about.init();