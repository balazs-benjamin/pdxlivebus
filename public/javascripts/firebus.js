var buses = { };
var routeMarkers = {};
var map;
var routeMods = {
	'100': {color:'0F6AAC', text: 'MAX'},
	'190': {color:'FFC524', text: 'MAX'},
	'200': {color:'028953', text: 'MAX'},
	'193': {color:'000000',  text: 'SC'},
	'194': {color:'000000',  text: 'SC'},
	'90': {color:'D31F43', text:'MAX'}
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
    busID = bus.busID;

    if (routeMods[bus.route])
    {
    	directionColor = routeMods[routeText].color;
    	routeText = routeMods[routeText].text;
    }
    var marker = new google.maps.Marker({ icon: 'http://chart.googleapis.com/chart?chst=d_bubble_text_small&chld=bbT|'+routeText+'|' + directionColor + '|eee', position: busLatLng, map: map });
    buses[busID] = marker;
}

f.once("value", function(s) {
  s.forEach(function(b) {
	var name = b.name();
	newBus(b.val());
  });
});

f.on("child_changed", function(s) {
	var name = s.name(),
	busMarker = buses[name];

	if (typeof busMarker === 'undefined')
	{
		newBus(s.val());
	} 
	else
	{
		busMarker.animatedMoveTo(s.val().lat,s.val().lon);
	}
});

f.on("child_removed", function(s) {
	var name = s.name(),
	busMarker = buses[name];
	if (typeof busMarker !== 'undefined') {
		busMarker.setMap(null);
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