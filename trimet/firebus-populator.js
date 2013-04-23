/* Populate Firebase from the Trimet API:

*/

var Firebase = require('firebase');
var xml2js = require('xml2js');
var rest = require('restler');
var crc = require('crc');

var firebusRef = new Firebase('https://livemet.firebaseio.com/');
var locationIDs = [];
var updateInterval = 5000;

//LOAD CONFIG FIRST

function stopLocations() {
  var prod = "http://developer.trimet.org/ws/V1/stops?appID=70160A01CD4DF46AFD5868928&ll=45.522223,%20-122.674054&meters=200";
  return prod;
}

function busLocations() {
  var prod = "http://developer.trimet.org/ws/V1/arrivals?locIDs=" + locationIDs.join(',') + "&appID=70160A01CD4DF46AFD5868928";

  return prod;
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function coerce(n) {
  return isNumber(n) ? Number(n) : n;
}

function traverseAndCoerce(o) {
  var result = { };
  for(var key in o) {
    result[key] = coerce(o[key]);
  }
  return result;
}


function updateFirebaseWithData() {

  rest.get(busLocations()).on('complete', function(data) {
    var parser = new xml2js.Parser();

    parser.parseString(data, function(err, result){
      if (err)
      {
        console.log(err);
        //HANDLE IT
      }
      if (result && result.resultSet && result.resultSet.arrival)
      {
        result.resultSet.arrival.forEach(function(item){
          var bus = item['$'];
          var temp = {};
          console.log(bus['$']);
          if (bus.route)
          {
            var firebaseId = crc.crc32(bus.route + bus.piece + bus.locid);
            temp.lat = bus.blockPosition.lat;
            temp.lon = bus.blockPosition.lng;
            temp.route = bus.route;
            firebusRef.child('port').child(firebaseId).set(temp);
          }
        });
      }
    });
  });
}
function updateLocations() {
  if (locationIDs.length == 0) {
    setInterval(updateFirebaseWithData, updateInterval);

    rest.get(stopLocations()).on('complete', function(data) 
    {
      var parser = new xml2js.Parser();
      parser.parseString(data, function(err, result)
      {
        if (err)
        {
          console.log(err);
          //HANDLE IT YOU KNOW
        }

        if (result && result.resultSet)
        {
          //Load up all location ids
          //Synchronous is okay, just happens the first time
          result.resultSet.location.forEach(function(item)
          {
            var stop = item['$'];
            if (stop && stop.locid)
            {
              if (locationIDs.indexOf(stop.locid) == -1) {
               locationIDs.push(stop.locid);
              }
            }
          });          

        }

      });
    });
  } 
}

updateLocations();