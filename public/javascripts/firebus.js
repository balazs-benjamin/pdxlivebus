//MISC JS LOAD
//TWITTER
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');

var pdxlivebus = (function(window, document, Firebase, L,  undefined)
{

	var buses = {};
	map = {},
	markers = {},
	routeMods = {
	'100': {color:'blue-max train', text: 'MAX'},
	'190': {color:'yellow-max train', text: 'MAX'},
	'200': {color:'green-max train', text: 'MAX'},
	'193': {color:'000000',  text: 'SC'},
	'194': {color:'000000',  text: 'SC'},
	'90': {color:'red-max train', text:'MAX'}
	},
	center = new L.LatLng(45.525292,-122.668197),
	toggles = {
		bus: {ele: document.getElementById('show-buses'), status: 1, cb: filterVehicles},
		max: {ele: document.getElementById('show-max'), status: 1, cb: filterVehicles},
		sc: {ele: document.getElementById('show-sc'), status: 1, cb: filterVehicles}
	},
	firebase = new Firebase("https://livemet.firebaseio.com/port");
	function init()
	{
		//INITIATE MAP
		map = L.map('map_canvas', {attributionControl: false, zoomControl: false, fadeAnimation: false}).setView(center, 13);
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
		new L.Control.Attribution({position: 'bottomright'}).addAttribution('&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors. Data provided by <a href="http://trimet.org">TriMet</a>').addTo(map);
	
		//BIND FIREBASE
		firebase.once('value', newVehicle);
		firebase.on('child_changed', updateVehicle);
		firebase.on('child_removed', removeVehicle);
		for (toggle in toggles)
		{
			addEvent(toggles[toggle].ele, 'click', toggles[toggle].cb);
		}
	}
	function filterVehicles(e)
	{
		toggleSelected(this);
		e.preventDefault();
	}
	function addEvent(html_element, event_name, event_function) 
	{       
		if(html_element.attachEvent) 
		{
		  html_element.attachEvent("on" + event_name, function() {event_function.call(html_element);}); 
		}
		else if(html_element.addEventListener) 
		{
		  html_element.addEventListener(event_name, event_function, false);
		}
	}
	function toggleSelected(ele)
	{
		if (ele.className.indexOf('selected') === -1)
		{
			ele.className += ' selected';
		}
		else
		{
			ele.className = ele.className.replace(/selected/gi,'');
		}
	}

	function newVehicle(s)
	{
		s.forEach(function(b)
		{
			createVehicle(b.name(), b.val());
		});
	}

	function createVehicle(name, vehicle)
	{
		buses[name] = buses[name] || {};
		if (!routeMods[vehicle.route])
		{
			var classDirection = (vehicle.direction == 1 ? 'inbound' : 'outbound'),
			displayText = vehicle.route;
		}
		else
		{
			var classDirection = routeMods[vehicle.route].color,
			displayText = routeMods[vehicle.route].text;
		}

		var markerLocation = new L.LatLng(vehicle.lat, vehicle.lon),
		icon = L.divIcon({className: 'busmarker ' + classDirection, html: '<span>' + displayText + '</span>'}),
		marker = new L.Marker(markerLocation,{icon:icon}).addTo(map);
		marker.on('click', trackVehicle);
		marker.on('move', trackVehicle);
		buses[name].marker = marker;
		buses[name].info = vehicle;
	}

	function trackVehicle(m)
	{
		map.panTo(m.target._latlng);
		map.setZoom(16);
	}

	function removeVehicle(s)
	{
		var name = s.name(),
		busMarker = buses[name].marker;

		if (busMarker) {
			map.removeLayer(busMarker);
			buses[name] = null;
		}
	}

	function updateVehicle(s)
	{
		var name = s.name();
		if (!buses[name])
		{
			createVehicle(name, s.val());
		} 
		else
		{
			var busMarker = buses[name].marker;
			buses[name].info = s.val();

			var toLocation = new L.LatLng(s.val().lat, s.val().lon),
			fromLocation = busMarker.getLatLng(),
			chunked = chunLats([toLocation, fromLocation]);

			animateMarker(busMarker, chunked);
			/*var point = map.latLngToLayerPoint(location);
			var fx = new L.PosAnimation();
			fx.run(busMarker._icon, point, .25);*/
		}

	}

	

	function moveVehicle()
	{

	}
	return {
		init: init
	};

}(window, document, Firebase, L));

pdxlivebus.init();