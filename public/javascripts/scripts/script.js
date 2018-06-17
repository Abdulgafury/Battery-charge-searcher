var gmap,
    formatList = [],
    markers = [];
    marker = [];
    geoButtonsState = true;
$(function() {
    $('.tooltipped').tooltip();
    var windowHeight = window.innerHeight;
    document.getElementById("gmap").style.height = windowHeight + "px" ;
    navigator.getBattery().then(function(battery) {
        var battery_level_low = "../../images/battery-low.png";
            battery_level_middle = "../../images/battery-middle.png";
            battery_level_full = "../../images/battery-full.png";
            battery_level_charging = "../../images/battery-charging.gif";       
        function updateAllBatteryInfo() {
            updateLevelInfo();
        }
        updateAllBatteryInfo();
        battery.addEventListener('chargingchange', function() {
            updateLevelInfo();
        });
        battery.addEventListener('levelchange', function(){
            updateLevelInfo();
        });
        function updateLevelInfo(){
            if (battery.charging) {
                $('#battery-level-img').css('background-image', 'url(' + battery_level_charging + ')');
            } else if (battery.level * 100 > 66) {
                $('#battery-level-img').css('background-image', 'url(' + battery_level_full + ')');      
            } else if (battery.level * 100 <= 66 && battery.level * 100 > 33) {
                $('#battery-level-img').css('background-image', 'url(' + battery_level_middle + ')');      
            } else if (battery.level * 100 <= 33) {
                $('#battery-level-img').css('background-image', 'url(' + battery_level_low + ')');      
            }
            $('#battery_level').attr('data-tooltip', battery.level * 100 + "%");
        }
    });
});
function toggleLoading() {
    if (!$('#page-loading').hasClass('loading')) {
        $('#page-loading').addClass('loading');
        $('#load').addClass('load');
    } else {
        setTimeout(function() {
            $('#page-loading').removeClass('loading');
            $('#load').removeClass('load');
        }, 500);
    }
}
function toogleGeoButtons() {
    if (!$('#geo').hasClass('disabled')) {
        $('#geo').addClass('disabled');
        $('#geo i').text('location_disabled');
        $('#nearby').addClass('disabled');
        geoButtonsState = false;
    } else {
        $('#geo').removeClass('disabled');
        $('#geo i').text('gps_fixed');
        $('#nearby').removeClass('disabled');
        geoButtonsState = true;
    }
}
function responseProcessing(responseText) {
    formatList = [];
    for (let j = 0; j < responseText.length; j++) {
        formatList.push({
            id: responseText[j].placeID,
            name: responseText[j].name,
            address: responseText[j].address,
            distance: responseText[j].distance,
            weekday_text: responseText[j].weekday_text[new Date().getDay() - 1],
        });
    }
    $('#format_list_bulleted').removeClass('disabled');
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    for (let i = 0; i <= formatList.length - 1; i++) {
        marker[i] = new google.maps.Marker({
            map: gmap,
            icon: image,
            position: new google.maps.LatLng(responseText[i].latitude, responseText[i].longitude)
        });
        markers.push(marker[i]);
    }
}
$('#all').click(function() {
    toggleLoading();
    
    var data;
        image = {
            url: '../../images/icon.png',
            scaledSize: new google.maps.Size(45, 45),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 45)
        };
    responceAllPlaces();
    function responceAllPlaces() {
        if (geoButtonsState === false) {
            data = 'lang=ru&lat=0&lon=0';
            $.ajax({
                type : 'GET',
                data : data,
                url  : '/api/places/all',
                timeout: 5000
            })
            .done(function(responseText) {
                responseProcessing(responseText);
                gmap.setZoom(14);
            })
            .fail(function(jqXHR, textStatus) {
                if (textStatus === 'timeout') {
                    M.toast({html: 'Время ожидания соединения истекло. Повторите попытку'});
                } else {
                    M.toast({html: 'Ошибка. Повторите попытку'});
                }
                toggleLoading()
            })
            .always(function() {
                toggleLoading();
            });
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        }
        function showPosition(position) {        
            data = 'lang=ru&lat=' + position.coords.latitude + '&lon=' + position.coords.longitude;
            $.ajax({
                type : 'GET',
                data : data,
                url  : '/api/places/all',
                timeout: 5000
            })
            .done(function(responseText) {
                responseProcessing(responseText);
                gmap.setZoom(14);
            })
            .fail(function(jqXHR, textStatus) {
                if (textStatus === 'timeout') {
                    M.toast({html: 'Время ожидания соединения истекло. Повторите попытку'});
                } else {
                    M.toast({html: 'Ошибка. Повторите попытку'});
                }
                toggleLoading()
            })
            .always(function() {
                toggleLoading();
            });
        }
    }
});
$('#nearby').click(function() {
    toggleLoading();

    var data;
        image = {
            url: '../../images/icon.png',
            scaledSize: new google.maps.Size(45, 45),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 45)
        };
    responceNearbyPlaces();
    function responceNearbyPlaces() {
        navigator.geolocation.getCurrentPosition(function(position) {
            data = 'lang=ru&lat=' + position.coords.latitude + '&lon=' + position.coords.longitude;
            $.ajax({
                type : 'GET',
                data : data,
                url  : '/api/places/nearby',
                timeout: 5000
            })
            .done(function(responseText) {
                if (responseText == 'Database is empty') {
                    M.toast({html: 'В данном регионе нет совподений.'});
                } else {
                    responseProcessing(responseText);
                    gmap.setZoom(15);   
                }
            })
            .fail(function(jqXHR, textStatus) {
                if (textStatus === 'timeout') {
                    M.toast({html: 'Время ожидания соединения истекло. Повторите попытку'});
                } else {
                    M.toast({html: 'Ошибка. Повторите попытку'});
                }
                //toggleLoading()
            })
            .always(function() {
                toggleLoading();
            });
        });
    }
});
$('#format_list_bulleted').click(function() {
    myList.parse(formatList, "json");
    $('.modal').modal({
        dismissible: true
    });
    $('#formatListModal').modal('open');
    myList.attachEvent("onItemClick", function (id, ev, html){
        console.log("Clicked")
        return true;
    });
});
var myList = new dhtmlXList({
    container:"data_container",
    type:{
        template:"html->container_temp",
        height: "auto"
    },
    select: true,
});


function initMap() {
    gmap = new google.maps.Map(document.getElementById('gmap'), {
        zoom: 12,
        center: new google.maps.LatLng(52.268796099999996, 76.9702987),
        disableDefaultUI: true
    });
    gmap.controls[google.maps.ControlPosition.RIGHT_TOP].push(geo);
    gmap.controls[google.maps.ControlPosition.RIGHT_TOP].push(all);
    gmap.controls[google.maps.ControlPosition.RIGHT_TOP].push(nearby);
    gmap.controls[google.maps.ControlPosition.RIGHT_TOP].push(battery_level);
    gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(format_list_bulleted);
    
    geoSettings = {
        timeout: 1000 * 10,
        maximumAge: 1000 * 60,
        enableHighAccuracy: true
    }
    navigatorPermisstion();
    function navigatorPermisstion() {

        navigator.permissions.query({
            name: 'geolocation'
        }).then(function(result) {
            if (result.state == 'granted') {
                getLocation();
            } else if (result.state == 'prompt') {
                navigator.geolocation.getCurrentPosition(revealPosition, positionDenied, geoSettings);
            } else if (result.state == 'denied') {
                toogleGeoButtons();
            }
            result.onchange = function() {
                toogleGeoButtons();
            }
        });    
    }
    
    function revealPosition(position) {
        console.log(position)
    }
    function positionDenied(positionError) {
        console.log(positionError)
    }

    $('#geo').click(function() {
        marker.setMap(null)
        getLocation();
    });

    
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            alert("Geolocation is not supported by this browser.");
            toogleGeoButtons();
        }
        function showPosition(position) {        
            var curLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            gmap.setCenter(curLatLng);
            gmap.setZoom(18);
            var image = {
                url: '../../images/my-location.png',
                scaledSize: new google.maps.Size(45, 45),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(20, 45)
            };
            marker = new google.maps.Marker({
                map: gmap,
                icon: image,
                position: curLatLng
            });
        }
    }


}


