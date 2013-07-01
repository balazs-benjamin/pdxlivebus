 var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , http = require('http')
  , path = require('path')
  , Firebase = require('firebase')
  , request = require('request')
  , xml2js = require('xml2js')
  , moment = require('moment')
  , domain = require('domain')
  , appDomain = domain.create()
  , later = require('later')
  , masterVehicleList = {}
  ,array = require("array-extended");


  var fbref = new Firebase('https://livemet.firebaseio.com/');
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
  app.set('view engine', 'ejs');
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
app.get('/routes/:route',routes.route);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


function proxycall()
{
  queryTrimet(processResults);
}

function processResults (results, scresults)
{
  if (results) {

    var currentList = [];
    var masterList = Object.keys(masterVehicleList);
    JSON.parse(results).resultSet.vehicle.forEach(function(bus)
    {
      var temp = {};
      if ( (bus.vehicleID && bus.routeNumber && bus.routeNumber != '921' && bus.routeNumber != '922'))
      {
        //MAKE A MAP TO LOOP AND ASSIGN
        temp.busID = bus.vehicleID;
        temp.lat = bus.latitude;
        temp.lng = bus.longitude;
        temp.route = bus.routeNumber;
        temp.direction = bus.direction;
        temp.expires = bus.expires;
        temp.lasttime = bus.time;
        temp.lastLocID = bus.lastLocID;
        temp.nextLocID = bus.nextLocID;
        if (bus.delay)
        {
          temp.delay = bus.delay;
        }
        if (bus.tripID) {
          temp.tripnumber = bus.tripID;
        }
        if (bus.blockID)
        {
          temp.block = bus.blockID;
        }        

        //IF A BUS CHANGES ROUTES THEN REMOVE IT FROM THE ROUTE BEFORE ADDED TO THE NEW ONE
        if (masterVehicleList[temp.busID] !== temp.route && !!masterVehicleList[temp.busID])
        {
         fbref.child('pdxlivebus').child(masterVehicleList[temp.busID]).child(temp.busID).remove();
        }

        currentList.push(temp.busID);

        masterVehicleList[temp.busID] = temp.route;

        temp.destination = bus.signMessageLong || '';
        fbref.child('pdxlivebus').child(temp.route).child(temp.busID).set(temp);
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
              temp.lng = vehicle.lon;
              temp.route = 'SC';
              temp.direction = 0;
              temp.tripnumber = 0;
              temp.block = 0;
              temp.destination = '';
              fbref.child('pdxlivebus').child(temp.route).child('sc'+vehicle.id).set(temp);
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
  rUrl = 'http://developer.trimet.org/beta/v2/vehicles?appid=' + config.appid + '';
  rSCUrl = 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=portland-sc&t=12345';
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
process.on('uncaughtException', function(err) {
  console.log(err);
});


function removeAll()
{
  //REAPS ALL VEHICLES 
  fbref.child('pdxlivebus').remove();
  masterVehicleList = {};
}

 var updateSchedule = later.parse.text('every 10 seconds');
 later.setInterval(proxycall, updateSchedule);

 var reapSchedule = later.parse.text('every 3 hours');
 later.setInterval(removeAll, reapSchedule);

