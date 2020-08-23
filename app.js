'use strict'
var mymap; //Karte
var schoolData = {}; //Schuldaten wird gefüllt durch readTextFile
var start = []; //Adresseingabe
var end = []; //ausgewählte Schule beide im Format LatLng 
var legend;
var geojsoncontrol = {}; //Overlays
var marker_alleSchulen = L.layerGroup([]);
var marker_address = L.layerGroup([]);
var polyline_layer = L.layerGroup([]);
var control_layers;
var selection_layer = L.layerGroup([]);
var perimeter_layer = L.layerGroup([]);
var schoolType; //Schulart
var ref; //Schulnummer
var primarySchoolDistricts; //Grundschulbezirke



function appStart() {
    //Filereader Schulen
    readTextFile("data/Schulen.geojson", handleData)
    $("#infolabel").load("data/informationstext.txt");
    initializeMap(); //Initialisierung der Karte
    
}

//Koordinaten aus Schulnummer
function getCoord(ref) {
    for (let i = 0; i < schoolData.features.length; i++) {
        if (schoolData.features[i].properties.ref == ref) {
            return [schoolData.features[i].geometry.coordinates[1], schoolData.features[i].geometry.coordinates[0]];
        }
    }

}
//lokale JSON-Datei einlesen
function readTextFile(file, callback) {
    var request = new XMLHttpRequest();
    request.overrideMimeType("application/json");
    request.open("GET", file, true);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status == "200") {
            callback(request.responseText);
        }
    }
    request.send(null);
}

//Callbackfunktion von readTextFile
function handleData(text) {
    var data = JSON.parse(text);
    schoolData = data;
    setSchoolList();
    setMarkerAll(data);
    return data;
}

//Leaflet-Karte initialisieren
function initializeMap() {
    mymap = L.map('mapid', {
        center: [50, 8],
        zoom: 8,
    });
    //Baselayer
    var baselayer_osm = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.statistik.rlp.de/de/gesellschaft-staat/bildung/publikationen/">Statistisches Landesamt Rheinland-Pfalz</a> | Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors <br>  | Powered by <a href="https://www.graphhopper.com/">GraphHopper API</a> | Service © <a href="https://www.openrouteservice.org">openrouteservice.org</a> | &copy; <a href="https://www.mapbox.com">Mapbox</a>'
    }).addTo(mymap);
    var baseMap = {
        "OSM Standard": baselayer_osm,
    }
    //GeoJSON-Layer einlesen
    $.when($.getJSON('data/Mainz.geojson', function (json) { //Mainz Stadtgebiet Umring
            var layer1 = L.geoJSON(json, {
                style: {
                    fillOpacity: 0
                }
            });
            mymap.addLayer(layer1);
            geojsoncontrol["Mainz Stadtgebiet"] = layer1;

        }),

        $.getJSON('data/grundschulbezirke.geojson', function (json) { //Grundschulbezirke
            primarySchoolDistricts = json;
            var layer2 = L.geoJSON(json, {
                style: styleLayer
            }).bindTooltip(function (layer) {
                return layer.feature.properties.layer;
            });
            geojsoncontrol["Grundschulbezirke"] = layer2;
        }),

        $.getJSON('data/RLP.geojson', function (json) { //Rheinland-Pfalz Umring
            var layer3 = L.geoJSON(json, {
                style: {
                    fillOpacity: 0
                }
            });
            //beim Start direkt auf Karte anzeigen:
            mymap.addLayer(layer3);
            geojsoncontrol["Rheinland-Pfalz"] = layer3;

        }),
        $.getJSON('data/LK_SUEW.geojson', function (json) { //Umring Landkreis Südliche Weinstraße
            var layer4 = L.geoJSON(json, {
                style: {
                    fillOpacity: 0
                }
            });
            geojsoncontrol["Landkreis S&uuml;dliche Weinstra&szlig;e"] = layer4;
        })).then(function () {
        control_layers = L.control.layers(baseMap, geojsoncontrol).addTo(mymap);
    });

    //Legende
    legend = L.control({
        position: 'bottomleft',
    });
    legend.onAdd = function () {

        var div = L.DomUtil.create('div', 'info legend');
        var grades = ['#008800', '#ff0000', '#000088'];
        var planner = ['OpenRouteService', 'Graphhopper', 'Mapbox'];
        var labels = ['<strong>Routen</strong><br>'];
        div.innerHTML += labels;
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                "<i style='background:" + grades[i] + "'></i> " +
                planner[i] + '<br>';
        }
        div.innerHTML += "<i style='font-size:20px'> &#9549; </i>" + "au&szlig;erhalb der vorgeschriebenen Entfernung<br><i style='font-size:20px'>&#9473; </i>" + "innerhalb der vorgeschriebenen Entfernung<br>"
        return div;
    };

    //Zoom
    L.control.scale({
        imperial: true //miles und km
    }).addTo(mymap);

    //Vollbildmodus über Mapbox
    mymap.addControl(new L.Control.Fullscreen());

    //Geolocation für die Ermittlung des Mittelpunkts der Karte
    if ('geolocation' in navigator) { //Browser unterstützt Geolocation
        navigator.geolocation.getCurrentPosition(position => {
            L.marker([position.coords.latitude, position.coords.longitude], {
                draggable: true
            }).addTo(mymap).bindPopup('Here you are!').openPopup();
            mymap.setView([position.coords.latitude, position.coords.longitude]);

        }, showError);
    } else {
        console.log("Geolocation is not supported by this browser.");
        L.marker([49.955139, 7.310417], {
            draggable: true
        }).addTo(mymap);
        mymap.setView([49.955139, 7.310417], 8);
    }
}

// show error
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            break;
    }
    mymap.setView([49.955139, 7.310417], 8);
}

//Füllung für GeoJSON-Layer
function styleLayer(feature) {
    return {
        fillColor: getColor(feature.properties.layer),
        weight: 2,
        opacity: 1,
        fillOpacity: 0.3
    };
}

//Farben aus Datei color_bezirke.js
function getColor(d) {
    for (let i = 0; i < farben.length; i++) {
        if (farben[i].name == d) {
            return farben[i].farbe;

        }

    }

}

//Marker für einzelne Schule setzen 
function setMarker(schule, layername) {
    if (schule.geometry.coordinates != "undefined") {
        var koord = schule.geometry.coordinates.reverse();
        //unterschiedliche Icons für die Schulart und Popup
        if (schule.properties["school:de"] == "Grundschule") {
            var marker = L.marker(koord, {
                draggable: false, //kann nicht versetzt werden
                icon: L.icon({
                    iconUrl: 'icons/gs_icon.ico',
                    iconSize: [32, 32],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, 0]
                })
            }).bindPopup(setPopuptext(schule));
        }
        if (schule.properties["school:de"] == "Gymnasium") {
            var marker = L.marker(koord, {
                draggable: false,
                icon: L.icon({
                    iconUrl: 'icons/gy_icon.ico',
                    iconSize: [32, 32],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, 0]
                })
            }).bindPopup(setPopuptext(schule));
        }
        if (schule.properties["school:de"] == "Förderschule") {
            var marker = L.marker(koord, {
                draggable: false,
                icon: L.icon({
                    iconUrl: 'icons/foes_icon.ico',
                    iconSize: [32, 32],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, 0]
                })
            }).bindPopup(setPopuptext(schule));
        }
        if (schule.properties["school:de"] == "Freie Waldorfschule") {
            var marker = L.marker(koord, {
                draggable: false,
                icon: L.icon({
                    iconUrl: 'icons/fws_icon.ico',
                    iconSize: [32, 32],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, 0]
                })
            }).bindPopup(setPopuptext(schule));
        }
        if (schule.properties["school:de"] == "Gesamtschule") {
            var marker = L.marker(koord, {
                draggable: false,
                icon: L.icon({
                    iconUrl: 'icons/igs_icon.ico',
                    iconSize: [32, 32],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, 0]
                })
            }).bindPopup(setPopuptext(schule));
        }
        if (schule.properties["school:de"] == "Grundschule;Realschule Plus") {
            var marker = L.marker(koord, {
                draggable: false,
                icon: L.icon({
                    iconUrl: 'icons/grs_icon.ico',
                    iconSize: [32, 32],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, 0]
                })
            }).bindPopup(setPopuptext(schule));
        }
        if (schule.properties["school:de"] == "Realschule Plus" || schule.properties["school:de"] == "Realschule") {
            var marker = L.marker(koord, {
                draggable: false,
                icon: L.icon({
                    iconUrl: 'icons/rs_icon.ico',
                    iconSize: [32, 32],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, 0]
                })
            }).bindPopup(setPopuptext(schule));
        }
        //reverse-Funktion ist destruktiv, verändert das originale Array, deshalb wieder rückgängig machen
        schule.geometry.coordinates.reverse();
        //welcher Layer wird befüllt
        if (layername == "selektion") {
            selection_layer.addLayer(marker);
        } else {
            if (layername == "alleSchulen") {
                marker_alleSchulen.addLayer(marker);
            } else {
                if (layername == "umkreis") {
                    perimeter_layer.addLayer(marker);
                } else {
                    if (layername == "route") {
                        polyline_layer.addLayer(marker)
                    }
                }

            }
        }

    }


}


function setPopuptext(obj) {
    if (obj.properties["operator:type"] == "public") {
        var rechtsstatus = "&ouml;ffentliche Schule";
    } else {
        var rechtsstatus = "private Schule";
    }
    var tabelle = "<table ><tr>  <th>Name</th>  <th>" + obj.properties.name + "</th></tr><tr>  <td>Schulart</td>  <td>" + obj.properties["school:de"] + "</td></tr><tr>  <td>Adresse</td>  <td>" + obj.properties["addr:street"] + " " + obj.properties["addr:housenumber"] + "<br>" + obj.properties["addr:postcode"] + " " + obj.properties["addr:city"] + "<br></td></tr><tr>  <td>Träger<br></td>  <td>" + obj.properties.operator + "</td></tr><tr>  <td>Rechtsstatus</td>  <td>" + rechtsstatus + "</td></tr><tr>  <td>Schulnummer</td>  <td>" + obj.properties.ref + "</td></tr><tr>  <td>Website<br></td>  <td><a href=" + obj.properties.website + ">" + obj.properties.website + "</a></td></tr><tr>  <td>Telefon</td>  <td>" + obj.properties.phone + "</td></tr><tr>  <td>ISCED-Level</td>  <td>" + obj.properties["isced:level"] + "</td></tr></table>"
    return tabelle;
}

//Marker für mehrere Schulen (Liste) setzen
function setMarkerAll(schools) {
    for (let i = 0; i < schools.features.length; i++) {
        setMarker(schools.features[i], "alleSchulen");
    }
    geojsoncontrol["Alle Schulen"] = marker_alleSchulen;
}


function Deg2Rad(deg) {
    return deg * Math.PI / 180;
}

//2D-Strecke aus Koordinaten
function dist_latlon(latlon1, latlon2) {
    var lat1 = Deg2Rad(latlon1[0]);
    var lat2 = Deg2Rad(latlon2[0]);
    var lon1 = Deg2Rad(latlon1[1]);
    var lon2 = Deg2Rad(latlon2[1]);
    var R = 6371000; // [m]
    var x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    var y = (lat2 - lat1);
    var d = Math.sqrt(x * x + y * y) * R;
    return d; //[m]
}

//Anwendungsbereich Schulen im Umkreis
function getSchoolsPerimeter() {
    if (abstand_umkr.value != "" && parseInt(abstand_umkr.value) <= 40000) {
        var schulen_gefiltert = {};
        schulen_gefiltert.features = [];
        //Schularten filtern
        if (umkr_GS.checked) {
            //alle GS-Objekte durchlaufen
            for (let i = 0; i < schoolData.features.length; i++) {
                if (schoolData.features[i].properties["school:de"].includes("Grundschule")) {
                    schulen_gefiltert.features.push(schoolData.features[i]);
                }
            }
        }
        if (umkr_GY.checked) {
            for (let i = 0; i < schoolData.features.length; i++) {
                if (schoolData.features[i].properties["school:de"] == "Gymnasium") {
                    schulen_gefiltert.features.push(schoolData.features[i]);
                }
            }
        }
        if (umkr_RS.checked) {
            for (let i = 0; i < schoolData.features.length; i++) {
                if (schoolData.features[i].properties["school:de"].includes("Realschule")) {
                    schulen_gefiltert.features.push(schoolData.features[i]);
                }
            }
        }
        if (umkr_IGS.checked) {
            for (let i = 0; i < schoolData.features.length; i++) {
                if (schoolData.features[i].properties["school:de"] == "Gesamtschule") {
                    schulen_gefiltert.features.push(schoolData.features[i]);
                }
            }
        }
        if (umkr_FOES.checked) {
            for (let i = 0; i < schoolData.features.length; i++) {
                if (schoolData.features[i].properties["school:de"] == "Förderschule") {
                    schulen_gefiltert.features.push(schoolData.features[i]);
                }
            }
        }
        if (umkr_FWS.checked) {
            for (let i = 0; i < schoolData.features.length; i++) {
                if (schoolData.features[i].properties["school:de"] == "Freie Waldorfschule") {
                    schulen_gefiltert.features.push(schoolData.features[i]);
                }
            }
        }
        //rote Anzeige wenn kein Schulart ausgewählt ist
        if ((!umkr_FOES.checked) && (!umkr_FWS.checked) && (!umkr_GS.checked) && (!umkr_GY.checked) && (!umkr_IGS.checked) && (!umkr_RS.checked)) {
            var keine_Eingabe = document.getElementById('keine_art_umkr');
            keine_Eingabe.innerHTML = "Wähle bitte mind. eine Schulart";
            keine_Eingabe.style = 'color: red';
            return "";
        }

        //Doppelte Schulen entfernen
        var schulen_unique = {};
        schulen_unique.features = schulen_gefiltert.features.filter(function (elem, index, self) {
            return index === self.indexOf(elem);
        })

        //Isochronen Post-Request Isochrones API OpenRouteService
        var mitte = [start[1], start[0]]; //Format LonLat
        var abstand = abstand_umkr.value;
        let request = new XMLHttpRequest();
        request.open('POST', "https://api.openrouteservice.org/v2/isochrones/foot-walking");
        request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Authorization', apiKeys[0].key);
        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                var json = JSON.parse(this.responseText);
                var isochrone = json.features[0].geometry.coordinates; //Polygon
                isochroneTest(isochrone, schulen_unique);
            }
        };
        const body = '{"locations":[[' + mitte + ']],"range":[' + abstand + '],"range_type":"distance"}';
        request.send(body);
    } else {
        var keine_Eingabe = document.getElementById('falsche_E_abstand');
        keine_Eingabe.innerHTML = "Bitte gib eine g&uuml;ltige Zahl ein";
        keine_Eingabe.style = 'color: red';
        return "";
    }
    marker_address.addTo(mymap);

}

//Koordinaten der gefilterten Schulen testen, ob sie innerhalb Isochrone liegen
function isochroneTest(polygon, schulen) {
    var count = 0; //Anzahl Schulen innerhalb
    for (let i = 0; i < schulen.features.length; i++) {
        var testkoord = schulen.features[i].geometry.coordinates;
        if (inside(testkoord, polygon[0])) {
            count++;
           
            setMarker(schulen.features[i], "umkreis");
            //Ergebnissliste erzeugen mit Buttons zum Zoomen
            var element = document.createElement('li');
            var btn = document.createElement('BUTTON');
            btn.className = "w3-button w3-tiny listebuttons";
            btn.id = schulen.features[i].properties.ref;
            btn.innerHTML = "" + schulen.features[i].properties.name + ", " + schulen.features[i].properties["addr:street"] + " " + schulen.features[i].properties["addr:housenumber"] + ", " + schulen.features[i].properties["addr:city"];
            btn.onclick = function () {
                var koord = getCoord(this.id);
                mymap.setView(koord, 17); //auf Schule zoomen
            };
            element.appendChild(btn);
            ausgabe_list.appendChild(element);
        }
    }

    
    if (count == 1) {
        var ergebnis = document.createElement('li');
        var text = document.createElement('p');
        text.innerHTML = "Es wurde <b>1</b> Schule gefunden"
        ergebnis.appendChild(text);
        ausgabe_list.insertBefore(ergebnis, ausgabe_list.childNodes[0]);
    } else {

        let ergebnis = document.createElement('li');
        var text = document.createElement('p');
        text.innerHTML = "Es wurden <b>" + count + "</b> Schulen gefunden";
        ergebnis.appendChild(text);
        ausgabe_list.insertBefore(ergebnis, ausgabe_list.childNodes[0]);
    }
    var lonlats = polygon[0];
    var latlngs = [];
    //in Format LatLon tauschen
    for (let i = 0; i < lonlats.length; i++) {
        latlngs.push(lonlats[i].reverse());
    }
    var polyline = L.polyline(latlngs, {
        color: 'red'
    }).addTo(mymap);
    mymap.fitBounds(polyline.getBounds());
    perimeter_layer.addLayer(polyline);
    perimeter_layer.addTo(mymap);
}


//Adressensuche mit Nominatim
async function searchAddress() {
    //Karte leeren
    marker_address.clearLayers();
    perimeter_layer.clearLayers();
    polyline_layer.clearLayers();
    selection_layer.clearLayers();
    marker_alleSchulen.removeFrom(mymap);

    //Eingabestring durchlaufen, welcher Anwendungsbereich ist ausgewählt
    var adresse_aktuell = "";
    if (btn_auswahl.innerHTML == "Routenplanung Schulweg") {
        adresse_aktuell = address.value;
    }
    if (btn_auswahl.innerHTML == "Schulen im Umkreis") {
        adresse_aktuell = address_umkr.value;
    }
    if (adresse_aktuell != "") {
        var adr_nom = encodeURIComponent(adresse_aktuell); //als URL kodieren
        var url_nom = 'https://nominatim.openstreetmap.org/search?q=' + adr_nom + '&format=geojson&polygon=1&addressdetails=1&extratags=1';
        const response = await fetch(url_nom);
        const data = await response.json();
        
        if (data.features[0] == undefined) { //kein Ergebnis von Nominatim
            if (btn_auswahl.innerHTML == "Routenplanung Schulweg") {
                var ke = document.getElementById('falsche_E');
                ke.innerHTML = "Bitte gib eine g&uuml;ltige Adresse ein";
                ke.style = 'color: red';
                return "";
            } else {
                if (btn_auswahl.innerHTML == "Schulen im Umkreis") {
                    var ke = document.getElementById('falsche_E_umkr');
                    ke.innerHTML = "Bitte gib eine g&uuml;ltige Adresse ein";
                    ke.style = 'color: red';
                    return ""
                }
            }
        } else {
            var latlng = data.features[0].geometry.coordinates;
            start = [latlng[1], latlng[0]];
            //Marker Haus setzen
            var addressmarker = L.marker(start, {
                draggable: true, //möglich zu versetzen um genaue Koordinaten zu benutzen
                icon: L.icon({
                    iconUrl: 'icons/haus_gruen.ico',
                    iconSize: [32, 32],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, 0]
                })
            })
            //falls Marker versetzt wird
            addressmarker.on('dragend', function (e) {
                perimeter_layer.clearLayers();
                start = [addressmarker.getLatLng().lat, addressmarker.getLatLng().lng]; //Koordinaten des Markers holen
                if (btn_auswahl.innerHTML == "Routenplanung Schulweg") {
                    $("#ausgabetabelle tr").remove();
                    $("#kategorientabelle tr").remove();
                    nextSchools(); //zuständige Grundschule und nächstgelegene weiterführende Schulen
                    startRouting();
                } else {
                    document.getElementById("ausgabe_list").innerHTML = "";
                    $("#ausgabe_list").empty();
                    getSchoolsPerimeter();
                }

            });
            mymap.setView(start, 8);
            //in Adresszeile vollständige Adresse Schreiben und richtige Funktion aufrufen
            if (btn_auswahl.innerHTML == "Routenplanung Schulweg") {
                document.getElementById("address").value = data.features[0].properties.display_name;
                nextSchools();
                startRouting();
            }
            if (btn_auswahl.innerHTML == "Schulen im Umkreis") {
                document.getElementById("address_umkr").value = data.features[0].properties.display_name;
                getSchoolsPerimeter();
            }
            marker_address.addLayer(addressmarker);
        }
    } else {
        if (btn_auswahl.innerHTML == "Schulen im Umkreis") {
            var keinee_Eingabe = document.getElementById('falsche_E_umkr');
            keine_Eingabe.innerHTML = "Bitte gib eine Adresse ein";
            keinee_Eingabe.style = 'color: red';
            return "";
        } else {
            if (btn_auswahl.innerHTML == "Routenplanung Schulweg") {
                var falsche_Eingabe = document.getElementById('falsche_E');
                falsche_Eingabe.innerHTML = "Bitte gib eine Adresse ein";
                falsche_Eingabe.style = 'color: red';
                return ""
            }
        }
    }
    marker_address.addTo(mymap);
}


//zuständiger Grundschulbezirk + Grundschule und nächstegelegene weiterführende Schulen ermitteln
async function nextSchools() {
    var restriction = 5;
    var schoolType = ["Gymnasium", "Realschule Plus", "Gesamtschule"];
    for (let s = 0; s < schoolType.length; s++) {
        //Prototyp besitzt nur 3 IGS in Mainz, sonst hängt sich Programm in endloser whileschleife fest
        if (s == 2) {
            restriction = 3;
        }
        var feature = [];
        var radius = 5000;
        while (feature.length < restriction) {
            for (let x = 0; x < schoolData.features.length; x++) { //schauen welches feature als erstes gymnasium ist für eingangsberechnung
                if ((schoolData.features[x].properties["school:de"] == schoolType[s]) && (dist_latlon(start, [schoolData.features[x].geometry.coordinates[1], schoolData.features[x].geometry.coordinates[0]]) < radius)) {
                    feature.push(schoolData.features[x]); //ist grundschule

                }
            }
            radius += 1000;
        }
        //genaue Fußwegrouten mit OpenRouteService
        for (let i = 0; i < feature.length; i++) {
            var url = "https://api.openrouteservice.org/v2/directions/foot-walking?api_key=" + apiKeys[0].key + "&start=" + start[1] + "," + start[0] + "&end=" + feature[i].geometry.coordinates[0] + "," + feature[i].geometry.coordinates[1] + "";
            const response = await fetch(url);
            const json = await response.json();
            feature[i].distance = json.features[0].properties.summary.distance;
        }
        //geringsten Weg filtern 
        var dist = feature[0].distance;
        var outputfeature = feature[0];
        for (let x = 1; x < feature.length; x++) {
            if (feature[x].distance <= dist) {
                outputfeature = feature[x];
                dist = feature[x].distance
            }
        }
        if (outputfeature != undefined) {
            var output = outputfeature.properties.name + ", " + outputfeature.properties["addr:city"];

        } else {
            var output = "-";
        }

        //Gymnasium mitroute
        if (s == 0) {
            var output_gy = output;
        }
        //Realschule mit route
        if (s == 1) {
            var output_rs = output;
        }
        //IGS mit route
        if (s == 2) {
            var output_igs = output;
        }
    }

    //Grundschulbezirk plus Schule
    var testpunkt = [start[1], start[0]];
    for (let i = 0; i < primarySchoolDistricts.features.length; i++) {
        for (let x = 0; x < primarySchoolDistricts.features[i].geometry.coordinates.length; x++) {
            if (inside(testpunkt, primarySchoolDistricts.features[i].geometry.coordinates[x][0])) {
               
                var output_gsbezirk = primarySchoolDistricts.features[i].properties.layer;
                var output_gs = primarySchoolDistricts.features[i].properties.school;
            }
        }
    }
    if (output_gsbezirk == undefined) {
        marker_address.eachLayer(function (layer) {
            layer.bindPopup("<table><tr><td><b>Grundschulbezirk</b></td><td>" + "<i>in diesem Bereich sind keine Informationen über Grundschulbezirke vorhanden</i>" + "</td></tr><tr><td><b>Zuständige Grundschule</b></td><td>" + "-" + "</td></tr><tr><td><b>Nächstgelegenes Gymnasium</b></td><td>" + output_gy + "</td></tr><tr><td><b>Nächstgelegene Realschule</b></td><td>" + output_rs + "</td></tr><tr><td><b>Nächstegelegene Gesamtschule</b></td><td>" + output_igs + "</td></table>").openPopup();
        });
    } else {
        var inhalt = "<table><tr><td><b>Grundschulbezirk</b></td><td>" + output_gsbezirk + "</td></tr><tr><td><b>Zust&auml;ndige Grundschule</b></td><td>" + output_gs + "</td></tr><tr><td><b>N&auml;chstgelegenes Gymnasium</b></td><td>" + output_gy + "</td></tr><tr><td><b>N&auml;chstgelegene Realschule</b></td><td>" + output_rs + "</td></tr><tr><td><b>N&auml;chstegelegene Gesamtschule</b></td><td>" + output_igs + "</td></table>"
        marker_address.eachLayer(function (layer) {
            layer.bindPopup(inhalt).openPopup();
        });
        
    }
  
}

//Hilfsfunktion
function round(wert, dez) {
    wert = parseFloat(wert);
    if (!wert) return 0;
    dez = parseInt(dez);
    if (!dez) dez = 0;
    var umrechnungsfaktor = Math.pow(10, dez);
    return Math.round(wert * umrechnungsfaktor) / umrechnungsfaktor;
}

//Point-In-Polygon Funktion GitHub
function inside(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    var x = point[0],
        y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
            yi = vs[i][1];
        var xj = vs[j][0],
            yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

//Anwendungsbereich Schulsuche, Selektion mit Paramtern
function filterSchools() {
    //Karte Leeren
    selection_layer.clearLayers();
    perimeter_layer.clearLayers();
    marker_address.clearLayers();
    polyline_layer.clearLayers();
    marker_alleSchulen.removeFrom(mymap);


    var objekt_start = {}
    objekt_start.features = [];
    var objekt_gefiltert = {};
    objekt_gefiltert.features = [];
    var objekt_neu = {}
    objekt_neu.features = [];
    var objekt_final = {}
    objekt_final.features = [];
    var objekt_isced = {}
    objekt_isced.features = [];

    //Namensteil
    if (name_input.value != "") {
        for (let b = 0; b < schoolData.features.length; b++) {
            //keine nummer wurde eingegeben

            if (schoolData.features[b].properties.name.toLowerCase().indexOf(name_input.value.toLowerCase()) != -1) {
                objekt_start.features.push(schoolData.features[b]);
            }

        }
    } else {
        objekt_start = schoolData;
    }
    
    //Schulart
    if (selek_GS.checked) {
        for (let i = 0; i < objekt_start.features.length; i++) {
            if (objekt_start.features[i].properties["school:de"].includes("Grundschule")) {
                objekt_gefiltert.features.push(objekt_start.features[i]); //schoolData.features[0].Schulnummer
            }
        }
    }
    if (selek_RS.checked) {
        for (let i = 0; i < objekt_start.features.length; i++) {
            if (objekt_start.features[i].properties["school:de"].includes("Realschule")) {
                objekt_gefiltert.features.push(objekt_start.features[i]); //schoolData.features[0].Schulnummer
            }
        }
    }
    if (selek_GY.checked) {
        for (let i = 0; i < objekt_start.features.length; i++) {
            if (objekt_start.features[i].properties["school:de"] == "Gymnasium") {
                objekt_gefiltert.features.push(objekt_start.features[i]); //schoolData.features[0].Schulnummer
            }
        }
    }
    if (selek_IGS.checked) {
        for (let i = 0; i < objekt_start.features.length; i++) {
            if (objekt_start.features[i].properties["school:de"] == "Gesamtschule") {
                objekt_gefiltert.features.push(objekt_start.features[i]); //schoolData.features[0].Schulnummer
            }
        }
    }
    if (selek_FOES.checked) {
        for (let i = 0; i < objekt_start.features.length; i++) {
            if (objekt_start.features[i].properties["school:de"] == "Förderschule") {
                objekt_gefiltert.features.push(objekt_start.features[i]); //schoolData.features[0].Schulnummer
            }
        }
    }
    if (selek_FWS.checked) {
        for (let i = 0; i < objekt_start.features.length; i++) {
            if (objekt_start.features[i].properties["school:de"] == "Freie Waldorfschule") {
                objekt_gefiltert.features.push(objekt_start.features[i]); //schoolData.features[0].Schulnummer
            }
        }
    }

    //Handling keine Auswahl getroffen
    if ((!selek_FOES.checked) && (!selek_FWS.checked) && (!selek_GS.checked) && (!selek_GY.checked) && (!selek_IGS.checked) && (!selek_RS.checked)) {
        var keine_Eingabe = document.getElementById('keine_art_sel');
        keine_Eingabe.innerHTML = "W&auml;hle bitte mind. eine Schulart";
        keine_Eingabe.style = 'color: red';
        return "";
    }
    

    //Schulnummer und Ort bzw. PLZ
    if (num.value == "" && ort.value == "") {
        // nichts wird weiter gefiltert
        objekt_neu = objekt_gefiltert;
    } else {
        if (num.value != "" && ort.value != "") {//Schulnummer und Ort eingegeben
            for (let k = 0; k < objekt_gefiltert.features.length; k++) {
                if (isNaN(parseInt(ort.value))) { //überprüfen ob zahl eingegeben wurde hier:Schulnummer und Ort eingegeben
                    if ((objekt_gefiltert.features[k].properties.ref == num.value) && (objekt_gefiltert.features[k].properties["addr:city"].toLowerCase().indexOf(ort.value.toLowerCase()) != -1)) {
                        objekt_neu.features.push(objekt_gefiltert.features[k]);
                    }
                } else {//Schulnummer und PLZ
                    if ((objekt_gefiltert.features[k].properties.ref == num.value) && (objekt_gefiltert.features[k].properties["addr:postcode"] == ort.value)) {
                        objekt_neu.features.push(objekt_gefiltert.features[k]);
                    }

                }
            }

        } else {
            if (num.value != "" && ort.value == "") {//nur Schulnummer
                for (let k = 0; k < objekt_gefiltert.features.length; k++) {
                    if (objekt_gefiltert.features[k].properties.ref == num.value) {
                        objekt_neu.features.push(objekt_gefiltert.features[k]);
                    }
                }
            } else {
                for (let k = 0; k < objekt_gefiltert.features.length; k++) {
                    if (isNaN(parseInt(ort.value))) { //Ort wurde eingegeben

                        if (objekt_gefiltert.features[k].properties["addr:city"].toLowerCase().indexOf(ort.value.toLowerCase()) != -1) {
                            objekt_neu.features.push(objekt_gefiltert.features[k]);
                        }
                    } else {//PLZ wurde eingegeben
                        if (objekt_gefiltert.features[k].properties["addr:postcode"] == ort.value) {
                            objekt_neu.features.push(objekt_gefiltert.features[k]);
                        }
                    }
                }
            }

        }
    }

    //Rechtsstatus öffentlich privat

    if ((oeff.checked && priv.checked) || (oeff.checked == false && priv.checked == false)) {
        //kein Filter
        objekt_final = objekt_neu;
    } else {

        //priv oder oeff
        if (oeff.checked && (priv.checked == false)) {//öffentlich
            for (let d = 0; d < objekt_neu.features.length; d++) {
                if (objekt_neu.features[d].properties["operator:type"] == "public") {
                    objekt_final.features.push(objekt_neu.features[d]);
                }
            }
        } else {//privat
            if (priv.checked && (oeff.checked == false)) {
                for (let d = 0; d < objekt_neu.features.length; d++) {
                    if (objekt_neu.features[d].properties["operator:type"] == "private") {
                        objekt_final.features.push(objekt_neu.features[d]);
                    }
                }
            }


        }


    }
//Ausgabe in Ergebnisliste
    if (objekt_final.features.length < 1) {
        var element = document.createElement('li');
        var p = document.createElement('p');
        p.innerHTML = "keine Ergebnisse"
        document.getElementById('ausgabe_list').appendChild(p);
    } else {
        //Doppelte Schulen entfernen
        var schulen_unique = {};
        schulen_unique.features = objekt_final.features.filter(function (elem, index, self) {
            return index === self.indexOf(elem);
        })
        //Ausgabe Liste
        var anzahl = schulen_unique.features.length;
        if (anzahl == 1) {
            var ergebnis = document.createElement('li');
            var text = document.createElement('p');
            text.innerHTML = "Es wurde <b>1</b> Schule gefunden"
            ergebnis.appendChild(text);
            ausgabe_list.appendChild(ergebnis);
        } else {
            var ergebnis = document.createElement('li');
            var text = document.createElement('p');
            text.innerHTML = "Es wurden <b>" + anzahl + "</b> Schulen gefunden";
            ergebnis.appendChild(text);
            ausgabe_list.appendChild(ergebnis);
        }
        //Liste erzeugen mit Buttons
        for (let n = 0; n < schulen_unique.features.length; n++) {
            setMarker(schulen_unique.features[n], "selektion");
            var element = document.createElement('li');
            var btn = document.createElement('BUTTON');
            btn.className = "w3-button w3-tiny listebuttons";
            btn.id = schulen_unique.features[n].properties.ref;
            btn.innerHTML = "" + schulen_unique.features[n].properties.name + ", " + schulen_unique.features[n].properties["addr:street"] + " " + schulen_unique.features[n].properties["addr:housenumber"] + ", " + schulen_unique.features[n].properties["addr:city"];
            btn.onclick = function () {

                var koord = getCoord(this.id)
                mymap.setView(koord, 17);

            };
            element.appendChild(btn);
            ausgabe_list.appendChild(element);

        }
        //Layer zur Karte hinzufügen
        selection_layer.addTo(mymap);
        mymap.setView([49.955139, 8], 8);
    }
}

//Auswahlliste erzeugen beim Start der Webanwendung aus den Schuldaten
function setSchoolList() {
    var schulen = schoolData;
    var liste = document.getElementById("list_schulen");
    for (let i = 0; i < schulen.features.length; i++) {

        if ((schulen.features[i].geometry.coordinates != "undefined")) {
            var element = document.createElement('li');
            var btn = document.createElement('BUTTON');
            btn.className = "w3-button w3-tiny listebuttons";
            btn.id = schulen.features[i].properties.ref;
            btn.style.width = "100%";
            btn.innerHTML = "" + schulen.features[i].properties.name + ",<br> " + schulen.features[i].properties["addr:street"] + " " + schulen.features[i].properties["addr:housenumber"] + ", " + schulen.features[i].properties["addr:city"];
            btn.onclick = function () {
                
                document.getElementById("schule").value = replaceString('<br>', '', this.innerHTML);
                //setview auf marker
                ref = this.id;
                if (ref < 40000 && ref > 30000) { //Schulnummernbereich Förderschule
                    $("#lernstufe").css('display', 'block');
                } else {
                    $("#lernstufe").css('display', 'none');
                }

                var koord = getCoord(ref);
                mymap.setView(koord, 17);
                end = koord;
            };
            element.appendChild(btn);
            liste.appendChild(element);
        }

    }


}

//Hilfsfunktion um den Zeilenumbruch <br> in Schuleingabeformular zu löschen
function replaceString(stringold, stringnew, string) {
    for (var i = 0; i < string.length; ++i) {
      if (string.substring(i, i + stringold.length) == stringold) {
        string = string.substring(0, i) + stringnew + string.substring(i + stringold.length, string.length);
      }
    }
    return string;
  }
  
  