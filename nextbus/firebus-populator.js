/* Populate Firebase from the NextBus XML API:
      agency list: http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList
      route list: http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=sf-muni
      vehic loc : http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&t=1362432121000
*/

var Firebase = require('firebase');
var xml2js = require('xml2js');
var rest = require('restler');
var crc = require('crc');

var firebusRef = new Firebase('https://livemet.firebaseio.com/');

var updateInterval = 5000;

function vehicleLocation() {
  var dev = "http://misc.firebase.com/~vikrum/nextbus.xml?dumb&a=";
  var prod = "http://developer.trimet.org/ws/V1/stops?appID=70160A01CD4DF46AFD5868928&ll=45.522223,%20-122.674054&meters=1000000";

  return prod;
}


function updateFirebaseWithData() {
    rest.get(vehicleLocation()).on('complete', function(data) {
      var parser = new xml2js.Parser();
  
      parser.parseString(data, function (err, result) {
       if (result && result.resultSet) 
	   {
		result.resultSet.location.forEach(function(item)
		{
		 var stop = item['$'];
		 if (stop && stop.locid)
		 {
			console.log(stop.locid);
		 }
		});
	   }
	  });
    });

}

setInterval((function() {
  updateFirebaseWithData();
}), updateInterval);
