
/*
 * GET home page.
 */
var Firebase = require('firebase');
var fbref = new Firebase('https://livemet.firebaseio.com/triroutes');
var fbrouteref = new Firebase('https://livemet.firebaseio.com/portRouteList');


exports.index = function(req, res){
 
  fbref.on('value', function(snapshot) {
  
  	res.render('index', { title: 'PDX LiveBus' , routes: snapshot.val()});
  });
};

exports.route = function(req, res)
{
	//RESPOND WITH ROUTES DATA
	fbrouteref.child(req.params.route).once('value', function(snapshot)
	{
		var json = []
		snapshot.forEach(function(s)
		{
			json.push(s.val());
		});
		res.json(json);
	});
	//req.params.route
}