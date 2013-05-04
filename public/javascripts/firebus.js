var buses = { };
var routeMarkers = {};
var map;

function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(45.52355,-122.675808),
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}

var d = new Date();

var f = new Firebase("https://livemet.firebaseio.com/routes");
var fstops = new Firebase('https://livemet.firebaseio.com/triroutes');
function newBus(bus, busID, routeName) {
    var busLatLng = new google.maps.LatLng(bus.lat, bus.lon);
    var directionColor = "7094FF";
    var marker = new google.maps.Marker({ icon: 'http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|'+routeName+'|' + directionColor + '|eee', position: busLatLng, map: map });
    buses[routeName + busID] = marker;
}
/*
function newStop(stop, routeName)
{ 
	var stopLatLng = new google.maps.LatLng(stop.lat, stop.lng);
	var stopColor = "7094FF";
    var marker = new google.maps.Marker({ icon: 'http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|'+routeName+'|' + stopColor + '|eee', position: stopLatLng, map: map });
    if (!routeMarkers[routeName]) {
    	routeMarkers[routeName] = [];
    }
    routeMarkers[routeName].push(marker);
}*/

fstops.once('value', function(s)
{
	var routes = [];
	s.forEach(function(route){
		var routeName = route.name();
		routes.push(routeName);
		route.child('stops').forEach(function(data)
		{
			newStop(data.val(),routeName);
		});
		console.log(routes.length);
	});
	console.log(routeMarkers);
})


f.once("value", function(s) {

  s.forEach(function(b) {
	var name = b.name();
	var buslist = b.val();
	for (bus in buslist) 
	{
		newBus(buslist[bus],buslist[bus].busID, name);
	}
  });
});

f.on("child_changed", function(s) {
	var route = s.name();
	s.forEach(function(b) {
		var name = b.name();
		var busMarker = buses[route + name];

		if (typeof busMarker === 'undefined')
		{
			newBus(b.val(),name,route);
		} 
		else
		{
			busMarker.animatedMoveTo(b.val().lat,b.val().lon);
		}
	});
});

f.on("child_removed", function(s) {
  var route = s.name();
	s.forEach(function(b) {
		var name = b.name();
		var busMarker = buses[route + name];
		if (typeof busMarker !== 'undefined') {
			busMarker.setMap(null);
			delete buses[route + name];
		}
	});
});
