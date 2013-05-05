var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , Firebase = require('firebase')
  , request = require('request')
  , async = require('async');
 
  var fbref = new Firebase('https://livemet.firebaseio.com/');
  var updateInterval = 10000;
  var app = express();


app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
  socket.emit('route');
  socket.on('route', function (data) {
    
  });
});

/*All trimet route #s*/
var trimetRoutes = ["1", "10", "100", "103", "11", "12", "14", "15", "152", "154", "155", "156", "16", "17", "18", "19", "190", "193", "194", "198", "20", "200", "203", "208", "21", "22", "23", "24", "25", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "4", "43", "44", "45", "46", "47", "48", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "6", "61", "62", "63", "64", "65", "66", "67", "68", "70", "71", "72", "75", "76", "77", "78", "79", "8", "80", "81", "83", "84", "85", "87", "88", "9", "90", "92", "93", "94", "96", "98", "99"];

function proxycall()
{
  queryTrimet(processResults);
}

function processResults (results)
{
  if (results) { 
    JSON.parse(results).features.forEach(function(bus)
    {
      var temp = {};
      temp.busID = bus.properties.vehicleNumber;
      temp.lat = bus.properties.lat;
      temp.lon = bus.properties.lon;
      temp.route = bus.properties.routeNumber;
      fbref.child('routes').child(temp.busID).set(temp);
      temp = null;
    });
  } else
  {
    console.log(results);
  }
};
function queryTrimet(cb) {
  var d = new Date(),
  rUrl = 'http://ride.trimet.org/rt/ws/V1/vehicles/appID/8EB2B259743166EF7569C6C78/epsg/EPSG:900913/?id=' + trimetRoutes.join(',') + '&reqTime=' + d.getTime() + '&reqCount=1';
  request(rUrl, function(err, resp, body)
  {
    if (err)
    {
      console.log(err);
    }
    d = null;
    cb(body);
  });
}
//proxycall();

setInterval((function() {
  proxycall();
}), updateInterval);