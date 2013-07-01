
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
var snapper = new Snap({
    element: document.getElementById('content'),
    disable: 'right',
    tapToClose: true,
    touchToDrag: false
});


var addEvent = function addEvent(element, eventName, func) {
	if (element.addEventListener) {
    	return element.addEventListener(eventName, func, false);
    } else if (element.attachEvent) {
        return element.attachEvent("on" + eventName, func);
    }
};

addEvent(document.getElementById('open-left'), 'click', function(){
	if( snapper.state().state=="left" ){
        snapper.close();
    } else {
        snapper.open('left');
    }
});

/* Prevent Safari opening links when viewing as a Mobile App */
(function (a, b, c) {
    if(c in b && b[c]) {
        var d, e = a.location,
            f = /^(a|html)$/i;
        a.addEventListener("click", function (a) {
            d = a.target;
            while(!f.test(d.nodeName)) d = d.parentNode;
            "href" in d && (d.href.indexOf("http") || ~d.href.indexOf(e.host)) && (a.preventDefault(), e.href = d.href)
        }, !1)
    }
})(document, window.navigator, "standalone");



var app = angular.module('LiveBus',["leaflet-directive",'firebase','ngCookies']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {    

});
app.controller('MapCtrl', function($scope, $cookies, angularFire )
{
    //CREATE THE MAP
    angular.extend($scope, {
        defaults: {
            tileLayer: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
            maxZoom: 19,
            zoomControl: false
        },
        center: {
        lat: 45.525292,
        lng: -122.668197,
        zoom: 13
        },
        markers: {}
    }
    );
    $scope.openModal = function()
    {
        var modal = angular.element(document.getElementById('myModal')),
        body = angular.element(document).find("body"),
        backdrop = angular.element(document.getElementById("modal-backdrop"));

        body.append('<div id="modal-backdrop"></div>');
        backdrop.addClass("modal-backdrop");
        body.addClass('modal-open');
        modal.css("display", "block");
    }

    $scope.closeModal = function()
    {
        var modal = angular.element(document.getElementById('myModal')),
            backdrop = document.getElementById("modal-backdrop"),
            body = angular.element(document).find("body");

            angular.element(backdrop).unbind().remove();
            angular.element(modal).css("display", "none");
            body.removeClass('modal-open');
    }

    //CLIENT SIDE ROUTE MODIFICATIONS
    $scope.routeMods = {
        '100': {color:'blue-max train', text: 'MAX'},
        '190': {color:'yellow-max train', text: 'MAX'},
        '200': {color:'green-max train', text: 'MAX'},
        '193': {color:'street-car',  text: 'SC'},
        '194': {color:'street-car',  text: 'SC'},
        '90': {color:'red-max train', text:'MAX'},
        'SC': {color:'street-car', text: 'SC'}
    }
    $scope.vehicles = {};
    $scope.fbref = new Firebase('https://livemet.firebaseio.com/pdxlivebus/');


    $scope.updateRoutes = function(routes)
    {
        $scope.$apply(function() {
            var routesJson = routes.val(),
            vehicles = {};
            angular.forEach(routesJson, function(val, key)
            {
                vehicles = angular.extend(vehicles,val);
            });
            $scope.vehicles = vehicles;
         })
    }
    $scope.updateRoute = function(route)
    {
        var routeData = route.val();
        $scope.$apply(function() {
            $scope.vehicles = routeData;
       })
    }

    $scope.updateVehicle = function(vehicle)
    {
        var vehicleData = {},
        temp = vehicle.val();

        vehicleData[temp.busID] = temp;
        $scope.$apply(function(){
            $scope.vehicles = vehicleData;
        })
    }
    $scope.updateVehicles = function(vehicles)
    {
        var vehicles = vehicles.val();
        $scope.$apply(function()
        {
            $scope.vehicles = vehicles;
        })
    }

    $scope.filterVehicles = function()
    {
        
    }

    //IF ROUTE CHANGES THEN REMOVE AND READD FOR APPROPRIATE ROUTE
    $scope.routeChange = function()
    {
        $scope.closeModal();
    }


    if ($cookies.routeSelection)
    {
        $scope.routeSelection = $cookies.routeSelection;
    }
    else
    {
        if (!!$cookies.isAll) {
            $scope.openModal();
        }
    }


    $scope.$watch('routeSelection', function(nr,or)
    {
        $cookies.routeSelection = nr;
        $cookies.isAll = (!nr ? true : false);

        if (!nr && !or)
        {
            $scope.fbref.on('child_changed',$scope.updateRoute);
            $scope.fbref.once('value', $scope.updateRoutes);
            $scope.markers = {};
            $scope.vehicles = {};
            return;
        }
        //FIRST CHANGE IF ALL
        if (!!nr && !or) {
            $scope.fbref.off('child_changed');
            $scope.fbref.child($scope.routeSelection).on('child_changed',$scope.updateVehicle);
            $scope.fbref.child($scope.routeSelection).once('value', $scope.updateVehicles);
            $scope.markers = {};
            $scope.vehicles = {};
        }
        //SIMPLE CHANGE
        else if (!!nr && !!or)
        {
            $scope.fbref.child(or).off('child_changed');
            $scope.fbref.child(nr).on('child_changed',$scope.updateVehicle);
            $scope.fbref.child(nr).once('value', $scope.updateVehicles);
            $scope.markers = {};
            $scope.vehicles = {};
        }
        //VALUE TO ALL
        else if (!nr && !!or)
        {
            $scope.fbref.child(or).off('child_changed');
            $scope.fbref.on('child_changed',$scope.updateRoute);
            $scope.fbref.once('value', $scope.updateRoutes);
            $scope.markers = {};
            $scope.vehicles = {};
        }
    })

    //WATCH FOR VEHICLE CHANGES
    $scope.$watch('vehicles',function(vehicles){
        if (!!vehicles) {
            for (vehicle in vehicles)
            {
                if (!$scope.routeMods[vehicles[vehicle].route])
                {
                    var classDirection = (vehicles[vehicle].direction == 1 ? 'inbound' : 'outbound'),
                    displayText = vehicles[vehicle].route;
                }
                else
                {
                    var classDirection = $scope.routeMods[vehicles[vehicle].route].color,
                    displayText = $scope.routeMods[vehicles[vehicle].route].text;
                }
                vehicles[vehicle].icon = {};
                vehicles[vehicle].icon.markerType = 'div';
                vehicles[vehicle].icon.className = 'busmarker ' + classDirection;
                vehicles[vehicle].icon.html = '<span>' + displayText + '</span>';
            }
            if (!!vehicles) {
                $scope.markers = angular.extend($scope.markers,vehicles);
            }  
        }
    });

});