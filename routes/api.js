var express = require('express');
var bodyParser = require('body-parser');
var firebase = require('firebase');
var axios = require('axios')


require('firebase/auth');
require('firebase/database');



var config = {
    apiKey: "AIzaSyARn84OSkDLxgqDW3Zr4lnzlmAm4Hys5DA",
    authDomain: "battary-205709.firebaseapp.com",
    databaseURL: "https://battary-205709.firebaseio.com",
    projectId: "battary-205709",
    storageBucket: "battary-205709.appspot.com",
    messagingSenderId: "95712887956"
  };
firebase.initializeApp(config);

var router = express.Router();

var jsonParser = bodyParser.json()

var urlencodedParser = bodyParser.urlencoded({ extended: false })

var database = firebase.database();

router.get('/', function(req, res, next) {
    res.render('index', {
        title: "API",
        question: "Как подключиться к нашему API?",
        answer: "Никак. Можешь не стараться"
    })
});


router.post('/places/add', jsonParser, function (req, res, next) {
	addPlaceData(req.body.placeID, req.body.lat, req.body.lon);
	function addPlaceData(placeID, lat, lon) {
		var gmapApiKey = 'AIzaSyDX6oiQDuVC6jtBbYsAJmdvro0kdsnCPWc';
			url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + placeID + '&key=' + gmapApiKey;

		axios.get(url)
	  		.then(function (response) {
	    		if (response.data.result.opening_hours === undefined) {
	    			res.sendStatus(400)
	    		} else {
	    			var data = firebase.database().ref('Places');
					data.once('value', function(snapshot) {
				    	firebase.database().ref('Places/' + placeID).set({
							placeID: placeID,
							lat: lat,
							lon: lon
						}, function(error) {
							if (error) {
								console.log('Error')
							} else {
								console.log('Success!')
							}
						});	    
					});
					res.sendStatus(200)
	    		}
	  		})
	  		.catch(function (error) {
	   			console.log(error);
	  		});
	}
});

router.post('/places/remove', jsonParser, function (req, res, next) {
	firebase.database().ref('Places/' + req.body.placeID).remove(function (error) {
	    if (!error) {
			res.sendStatus(200);
	    } else {
	    	res.sendStatus(400);
	    }
	});
});

router.get('/places/all', function(req, res, next) {
	var lat = req.query.lat
		lon = req.query.lon;	
		resData = [];
    	query = firebase.database().ref('Places');
   		i = 0;

	if (lat == 0 || lon == 0) {
		query.on("value", function(snapshot) { 
			console.log(snapshot.numChildren())
			if (snapshot.numChildren() == 0) {
				res.send("ZERO_RESULTS")
			}
		  	snapshot.forEach(function(childSnapshot) {
		  		childData = childSnapshot.val();

	  			var gmapApiKey = 'AIzaSyDX6oiQDuVC6jtBbYsAJmdvro0kdsnCPWc';
		    		placeID = childData.placeID;
		    		language = req.query.lang;
					url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + placeID + '&key=' + gmapApiKey + '&language=' + language;
				getResponce();
				function getResponce() {
					axios.get(url)
			  		.then(function (response) {
			    		if (response.status === 200) {
							resData.push({
								name: response.data.result.name,
								address: response.data.result.vicinity,
								placeID: response.data.result.place_id,
								open_now: response.data.result.opening_hours.open_now,
								weekday_text: response.data.result.opening_hours.weekday_text,
								latitude: response.data.result.geometry.location.lat,
								longitude: response.data.result.geometry.location.lng,
							});
					    	i++;
							if (i === snapshot.numChildren()){ 
				   				res.send(resData)
				   			}	
						} else if (response.status === "OVER_QUERY_LIMIT") {
							setTimeout(function() {
								getResponce();
							}, 250 );
						} else {
							console.log(response.status);
				  		}
			  		})
			  		.catch(function (error) {
			   			console.log(error);
			  		});
				}	
			});
		});
	} else {
		query.on("value", function(snapshot) { 
			console.log(snapshot.numChildren())
			if (snapshot.numChildren() == 0) {
				res.send("ZERO_RESULTS")
			}
		  	snapshot.forEach(function(childSnapshot) {
		  		childData = childSnapshot.val();

	  			var gmapApiKey = 'AIzaSyDX6oiQDuVC6jtBbYsAJmdvro0kdsnCPWc';
		    		placeID = childData.placeID;
		    		language = req.query.lang;
					url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + placeID + '&key=' + gmapApiKey + '&language=' + language;
					placeLat = childData.lat;
					placeLon = childData.lon;
					distanceMatrixApiUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + lat + ',' + lon + '&destinations=' + placeLat + ',' + placeLon + '&mode=walking&key=' + gmapApiKey;
				getResponce();
				function getResponce() {
					axios.all([
				    	axios.get(url),
				    	axios.get(distanceMatrixApiUrl)
				  	])
				  	.then(axios.spread((placesRes, distanceRes) => {
				  		// console.log(placesRes.status, distanceRes.status)
				  		if (placesRes.status === 200 && distanceRes.status == 200) {
							resData.push({
								name: placesRes.data.result.name,
								address: placesRes.data.result.vicinity,
								placeID: placesRes.data.result.place_id,
								open_now: placesRes.data.result.opening_hours.open_now,
								weekday_text: placesRes.data.result.opening_hours.weekday_text,
								latitude: placesRes.data.result.geometry.location.lat,
								longitude: placesRes.data.result.geometry.location.lng,
								distance: distanceRes.data.rows[0].elements[0].distance.text
							});
					    	i++;
							if (i === snapshot.numChildren()){ 
				   				res.send(resData)
				   			}	
						} else if (placesRes.status === "OVER_QUERY_LIMIT" || distanceRes.status == "OVER_QUERY_LIMIT") {
							setTimeout(function() {
								getResponce();
							}, 250 );
						} else {
							console.log(placesRes.status);
				  		}	
				  	}));
				}	
				

			});
		});
	}

});



router.get('/places/nearby', function(req, res, next) {
    var lat = req.query.lat
		lon = req.query.lon;
		//radius = req.param('radius');
		radius = 1000
		resData = [];
   		i = 0;
    	query = firebase.database().ref('Places');
	
	query.on("value", function(snapshot) { 
		if (snapshot.numChildren() == 0) {
			res.send("Database is empty")
		} else {
			snapshot.forEach(function(childSnapshot) {
		  		childData = childSnapshot.val();

				var placeLat = childData.lat;
					placeLon = childData.lon;
					displacement = getDistanceFromLatLonInKm(lat, lon, placeLat, placeLon)
					promiseData = new Promise(function(resolve, reject) {
		    	
				    	if (displacement <= radius) {
				    		var gmapApiKey = 'AIzaSyDX6oiQDuVC6jtBbYsAJmdvro0kdsnCPWc';
					    		placeID = childData.placeID;
					    		language = req.query.lang;
								url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + placeID + '&key=' + gmapApiKey + '&language=' + language;
								distanceMatrixApiUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + lat + ',' + lon + '&destinations=' + placeLat + ',' + placeLon + '&mode=walking&key=' + gmapApiKey;
							axios.all([
						    	axios.get(url),
						    	axios.get(distanceMatrixApiUrl)
						  	])
						  	.then(axios.spread((placesRes, distanceRes) => {
						  		if (placesRes.data.result === undefined) {
						  			console.log(placeID)
						  		}
						    	resData.push({
									name: placesRes.data.result.name,
									address: placesRes.data.result.vicinity,
									placeID: placesRes.data.result.place_id,
									open_now: placesRes.data.result.opening_hours.open_now,
									weekday_text: placesRes.data.result.opening_hours.weekday_text,
									latitude: placesRes.data.result.geometry.location.lat,
									longitude: placesRes.data.result.geometry.location.lng,
									distance: distanceRes.data.rows[0].elements[0].distance.text
								});
								i++;
								console.log("In radius!")
								resolve(resData)
								
						  	}));        
				    	} else {
				    		i++;
				    		resData.push("Is not in radius");
				    	}
					});
				promiseData.then(function(value) {
					if (i === snapshot.numChildren()){ 
						if (value == null || value == undefined) {
							console.log("Empty")
						}
						console.log(value)
		   				res.send(value)
		   			}	
				})
			});
		}
	});
});

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  	var R = 6371000;
  		dLat = deg2rad(lat2-lat1);
  		dLon = deg2rad(lon2-lon1);
  		a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  		c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  		d = R * c;
  	return d;
	function deg2rad(deg) {
	  return deg * (Math.PI/180)
	}
}

router.get('/params', function (req,res) {
    // recover parameters
    var user_id = req.param('id');
  	var token = req.param('token');
  	var geo = req.param('geo');  

  	var ans = "{'id': " + user_id + ", 'token': " + token + ", 'geo': " + geo + "}"
  	var obj = JSON.stringify(ans);
  	var result = JSON.parse(obj)
  	res.send(result);           
});
router.post('/signup', urlencodedParser, function (req, res) {
	console.log(req.body)
	//var newUserKey = firebase.database().ref().child('Users').push().key;
	//writeUserData(newUserKey, req.body.name, req.body.surname, req.body.email, req.body.phoneNumber, req.body.password);
	//res.redirect('/profile');
});
router.get('/user', function(request, response){
  response.send('user ' + request.query.id + ' name ' + request.query.name);
  console.log()
});

module.exports = router;