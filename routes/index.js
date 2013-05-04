
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

