
/*
 * GET home page.
 */
var firebase = require('firebase'),
async = require('async'),
request = require('request');

var fbref = new firebase('https://livemet.firebaseio.com/');

exports.index = function(req, res){
	fbref.child('triroutes').once('value', function(s)
	{
		var routes = []
		s.forEach(function(item)
		{
			if (item.val().type == 'bus') {
				routes.push({name: item.val().name, route: item.val().route});
			}
		});
		res.render('index', { title: 'Express',routes: routes });

	});
};

exports.proxy = function(req, res)
{
	var routes = req.query['routes'].split(',');
	
	async.map(routes, queryTrimet, function(err, results)
	{
		results.forEach(function(item) {
			var jsRes = JSON.parse(item.resp);
			jsRes.features.forEach(function(bus)
			{
				var temp = {};
				temp.busID = bus.properties.vehicleNumber;
				temp.tripNumber = bus.properties.tripNumber;
				temp.lat = bus.properties.lat;
				temp.lon = bus.properties.lon;
				temp.route = bus.properties.routeNumber;
				fbref.child('routes').child(temp.route).child(temp.busID).set(temp);
			})
		});
		res.send(JSON.stringify(results));
	});	

}

function queryTrimet(route, cb) {
	var d = new Date(),
	rUrl = 'http://ride.trimet.org/rt/ws/V1/vehicles/appID/8EB2B259743166EF7569C6C78/epsg/EPSG:900913/?id=' + route + '&reqTime=' + d.getTime() + '&reqCount=1';
	request(rUrl, function(err, resp, body)
	{
		if (err)
		{
			cb(err);
		}
		cb(null,{route:route, resp: body});
	});

}