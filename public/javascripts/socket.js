/*var socket = io.connect('http://firemet.aws.af.cm/');

socket.on('route', function (data) {
	var route = routeSelection.options[routeSelection.selectedIndex].value;
	socket.emit('route', { route: route });
});

function emitRoute()
{
	var route = routeSelection.options[routeSelection.selectedIndex].value;
	socket.emit('route', { route: route });
	for(r in routes)
	{
		console.log(r);
	}
}*/

var routeSelection = document.getElementById('routes');
function updateMap() {
	var d = new Date();
	var route = routeSelection.options[routeSelection.selectedIndex].value;
	$.ajax({url:'/proxy?routes=' + route + '&retTime=' + d.getTime()});
}

//routeSelection.addEventListener('change', emitRoute);

setInterval(updateMap, 3000);