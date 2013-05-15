 var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , http = require('http')
  , path = require('path')
  , Firebase = require('firebase')
  , request = require('request')
  , xml2js = require('xml2js')
  , moment = require('moment');
  
 
  var fbref = new Firebase('https://livemet.firebaseio.com/');
  var updateInterval = 5000;
  var app = express();
  var config = {
   appid: ''
  };

function loadConfig() {
  var env = process.env
  
  if (!env.NODE_ENV || env.NODE_ENV == 'development'){
    // desktop dev
    var data = fs.readFileSync('./config.json')
    try {
      config = JSON.parse(data);
    } catch (err) {
      console.log('There has been an error parsing your config.JSON.')
      console.log(err);
    }
  }
  else
  {
    console.log('CANNOT LOAD CONFIG!');
  }
}

loadConfig()
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
//var trimetRoutes = ["1", "10", "100", "103", "11", "12", "14", "15", "152", "154", "155", "156", "16", "17", "18", "19", "190", "193", "194", "198", "20", "200", "203", "208", "21", "22", "23", "24", "25", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "4", "43", "44", "45", "46", "47", "48", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "6", "61", "62", "63", "64", "65", "66", "67", "68", "70", "71", "72", "75", "76", "77", "78", "79", "8", "80", "81", "83", "84", "85", "87", "88", "9", "90", "92", "93", "94", "96", "98", "99"]; //, "921", "922"

function proxycall()
{
  queryTrimet(processResults);
}

function processResults (results, scresults)
{
  if (results) { 
    JSON.parse(results).resultSet.vehicle.forEach(function(bus)
    {
      var temp = {};
      if ( (bus.vehicleID && bus.routeNumber && bus.routeNumber != '921' && bus.routeNumber != '922'))
      {
        temp.busID = bus.vehicleID;
        temp.lat = bus.latitude;
        temp.lon = bus.longitude;
        temp.route = bus.routeNumber;
        temp.direction = bus.direction;
        temp.expires = bus.expires;
        temp.lasttime = bus.time;

        if (bus.tripID) {
          temp.tripnumber = bus.tripID;
        }
        if (bus.blockID)
        {
          temp.block = bus.blockID;
        }

        temp.destination = bus.signMessageLong || '';
        fbref.child('port').child(temp.busID).set(temp);
      }
      temp = null;
    });
  } else
  {
    console.log(results);
  }
  
  if (scresults)
  {
    xml2js.parseString(scresults, function(err, result)
    {
      if (!err)
      {
        if(result && result.body && result.body.vehicle) {
          var i = 0;
          result.body.vehicle.forEach(function(item) {
            var vehicle = item['$'];
            if(vehicle && vehicle.id) {
              var temp = {};
              temp.busID = 'sc'+vehicle.id;
              temp.lat = vehicle.lat;
              temp.lon = vehicle.lon;
              temp.route = 'SC';
              temp.direction = 0;
              temp.tripnumber = 0;
              temp.block = 0;
              temp.destination = '';
              fbref.child('port').child('sc'+vehicle.id).set(temp);
              temp = null;
            }
            i++;
          });
        }
      }
    });
  }
  else
  {
    console.log(scresults);
  }
};
function queryTrimet(cb) {
  var d = new Date(),
  rUrl = 'http://developer.trimet.org/beta/v2/vehicles?appid=' + config.appid + '&showNonRevenue=false';
  rSCUrl = 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=portland-sc&t=' + d.getTime();
  request(rUrl, function(err, resp, body)
  {
    d = null;
	if (!err && resp.statusCode == 200) {
    request(rSCUrl, function(scerr, scresp, scbody)
    {
        if (!scerr && scresp.statusCode == 200) {
          cb(body,scbody);
        }
        else
        {
          cb(body,null);
        }
    });
	}
	else
	{
		console.log(err);
		console.log(resp.statusCode);
	}
  });
}

setInterval((function() {
  proxycall();
}), updateInterval);