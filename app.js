
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , Firebase = require('firebase')
  , xml2js = require('xml2js')
  , rest = require('restler')
  , crc = require('crc')
  , request = require('request')
  , async = require('async');
  //, trimet = require('trimet');
/*
var gtfsEvents = require(path.join(__dirname,"lib","gtfs-parser","gtfs-timetable-parser.js"));
var mapDataGenerator = require(path.join(__dirname,"lib","map-data-generator","map-data-generator.js"));
var PathNormalizer = require(path.join(__dirname,"lib","path-normalizer","path-normalizer.js"));
*/
//var Gtfs = require(path.join(__dirname, "lib", "gtfs-parser", "gtfs-loader"));

//var gtfsdir = "trimet";


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
/*
var gtfs = Gtfs(process.env.GTFS_PATH || path.join(__dirname,"gtfs",gtfsdir), function(gtfsData){
  request('http://gtrb.aws.af.cm/?appID=70160A01CD4DF46AFD5868928', function(err, resp, body)
  {
    var data = JSON.parse(body);

    for (var trip in data.trips)
    {
      var trip_id = data.trips[trip].trip_id;
      for( var stop in data.trips[trip].stop_sequence)
      {
        console.log(gtfsData.getStopFromTripAndSeq(trip_id, data.trips[trip].stop_sequence[stop]));
      }
    }
  })
});*/
/*
var gtfs = Gtfs(process.env.GTFS_PATH || path.join(__dirname,"gtfs",gtfsdir), function(gtfsData){

  mapDataGenerator.gen(gtfsData, process.env.GTFS_PATH || path.join(__dirname,"gtfs",gtfsdir), function(mapData) {

    //calculate normalized shapes
    var pathNormalizer = PathNormalizer(mapData.getShapes());
    
    console.dir(mapData.getTrips());

    require(path.join(__dirname, '/routes/site'))(app, mapData.getStops(), mapData.getShapes(),mapData.getTrips());

    
    gtfsEvents.init(gtfsData, 10000, function(data) {
    
      var trips = data.trips;
      
      var pushData = {};
      
      for(var i in trips){
        if(trips.hasOwnProperty(i)){
          var delta = (trips[i].progressThen - trips[i].progressNow) / 10;
          //console.log(delta);
          var pointList = [];
          
          var shapeId = mapData.getShapeIdFromTripId(i);
          if (!shapeId) continue;
          
          for(var j = 0;j<10;j++){
            var idx = Math.floor((trips[i].progressNow + j*delta)*1000);
            if(idx === 1000 || idx ===0){
              pointList.push([0,0]);
            }
            else{
              pointList.push(pathNormalizer.getNormalizedPath(shapeId)[idx]);
            }
          }
          pushData[i] = pointList;
        }
      }
      
      /*
      var p = Math.floor(step.progress * 10);

      step['pointList'] = [];
      step['foo'] = p;
      for(var i = 0;i<10;i++){
        step['pointList'].push(pathNormalizer.getNormalizedPath("87001")[p+i]);
      
      }
      
      io.sockets.emit('event', pushData);
    });

  });
});


*/
var trimetRoutes = ["1", "10", "100", "103", "11", "12", "14", "15", "152", "154", "155", "156", "16", "17", "18", "19", "190", "193", "194", "198", "20", "200", "203", "208", "21", "22", "23", "24", "25", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "4", "43", "44", "45", "46", "47", "48", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "6", "61", "62", "63", "64", "65", "66", "67", "68", "70", "71", "72", "75", "76", "77", "78", "79", "8", "80", "81", "83", "84", "85", "87", "88", "9", "90", "92", "93", "94", "96", "98", "99"];

function proxycall()
{
  async.map(trimetRoutes, queryTrimet, function(err, results)
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
    console.log(rUrl);
    cb(null,{route:route, resp: body});
  });
}
setInterval((function() {
  proxycall();
}), updateInterval);