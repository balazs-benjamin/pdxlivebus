var buses = { };
var map;

function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(45.52355,-122.675808),
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}
      
var f = new Firebase("https://livemet.firebaseio.com/port");

function newBus(bus, firebaseId,busname) {
    var busLatLng = new google.maps.LatLng(bus.lat, bus.lng);
    var directionColor = "7094FF";
    var marker = new google.maps.Marker({ icon: 'http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bbT|'+firebaseId+'|' + directionColor + '|eee', position: busLatLng, map: map });
    buses[firebaseId+busname] = marker;
}

f.once("value", function(s) {
  s.forEach(function(b) {

	var name = b.name();
	var buslist = b.val();
	for (bus in buslist) 
	{
		newBus(buslist[bus],name, bus);
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
			newBus(b.val(),route,name);
		} 
		else
		{
			busMarker.animatedMoveTo(b.val().lat,b.val().lng);
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
