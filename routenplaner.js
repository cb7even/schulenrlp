'use strict'
//Zentrale Verwaltung der Routenplaner
function startRouting() {
    //vorherige Routen löschen
    polyline_layer.clearLayers();
    //Schulart der ausgewählten Schule 
    for (let i = 0; i < schoolData.features.length; i++) {
        if (schoolData.features[i].properties.ref == ref) {
            schoolType = schoolData.features[i].properties["school:de"];
            setMarker(schoolData.features[i], "route")
            break; //dass nicht zwei standorte mit der selben schulnummer einen Marker bekommen
        }
    }
    //Checkboxen überprüfen
    var element_routeORS = document.getElementById('route_ors');
    var element_routeGH = document.getElementById('route_gh');
    var element_routeMB = document.getElementById('route_mb');
    if ((end != "" && schule.value != "")) {
        if (element_routeORS.checked) {
            getRouteORS();
        }
        if (element_routeGH.checked) {
            getRouteGH();
        } else {
            $("#kategorienlabel").text("");
            let info_gh = document.createElement('p');
            info_gh.innerHTML = "Für mehr Informationen zu den einzelnen Wegekategorien der Routen w&auml;hle bitte den Routenplaner <b>GraphHopper</b> aus."
            document.getElementById('kategorienlabel').appendChild(info_gh)
        }
        if (element_routeMB.checked) {
            getRouteMB();
        }
        //kein Routenplaner wird gewählt
        if ((!element_routeGH.checked) && (!element_routeORS.checked) && (!element_routeMB.checked)) {
            var falsche_eingabe = document.getElementById('falsche_E_route');
            falsche_eingabe.innerHTML = "Bitte w&auml;hle mind. einen Routenplaner";
            falsche_eingabe.style = 'color: red';

        }
    } else {
        var keineschule = document.getElementById('falsche_E_schule');
        keineschule.innerHTML = "Bitte klicke auf eine Schule in der Liste";
        keineschule.style = 'color: red';
    }
    //Routen auf Karte anzeigen
    polyline_layer.addTo(mymap);
}

//OpenRouteService Eingabeformat Koordinaten Länge Breite (LonLat)
function getRouteORS() {
    var requestORS = new XMLHttpRequest();
    var url = "https://api.openrouteservice.org/v2/directions/foot-walking?api_key=" + apiKeys[0].key + "&start=" + start[1] + "," + start[0] + "&end=" + end[1] + "," + end[0];
    
    requestORS.open('GET', url);
    requestORS.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
    requestORS.onreadystatechange = function () {
        if (this.readyState === 4) { //DONE
            var json = JSON.parse(this.responseText);
            var lonlats = json.features[0].geometry.coordinates;
            var latlngs = [];
            //Latitude Longitude Format für Leaflet, tauschen der einzelnen Koordinatentupel
            for (let i = 0; i < lonlats.length; i++) {
                latlngs.push(lonlats[i].reverse());
            }
            //--Unterschiedliche Darstellung---------------------------------------------------------------------------------------------------------------------------                
            if ((json.features[0].properties.summary.distance > 2000 && schoolType == "Grundschule") || (json.features[0].properties.summary.distance > 4000 && schoolType != "Grundschule" && schoolType != "Förderschule") || (schoolType == "Förderschule" && lern1.checked && json.features[0].properties.summary.distance > 2000) || (schoolType == "Förderschule" && lern5.checked && json.features[0].properties.summary.distance > 4000)) {
                //gestrichelt
                var polyline = L.polyline(latlngs, {
                    className: "polyline_strich",
                    color: 'green'
                }).addTo(mymap);
            } else {
                //durchgezogen
                var polyline = L.polyline(latlngs, {
                    className: "polyline_normal",
                    color: 'green'
                }).addTo(mymap);
            }
            //-----------------------------------------------------------------------------------------------------------------------------
            polyline_layer.addLayer(polyline);
            mymap.fitBounds(polyline.getBounds());

            //Tabellenzeile erstellen und in Ausgabetabelle hinzufügen
            var table = document.getElementById("ausgabetabelle");
            var row = table.insertRow(0);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            cell1.innerHTML = "<b>OpenRouteService</b>";
            cell2.innerHTML = round((json.features[0].properties.summary.distance / 1000), 3) + "km";
        }
    };
    requestORS.send();
}




//GraphHopper Eingabeformat Koordinaten Breite Länge (LatLon)
function getRouteGH() {
    var requestGH = new XMLHttpRequest();
    var url = "https://graphhopper.com/api/1/route?point=" + start[0] + "," + start[1] + "&point=" + end[0] + "," + end[1] + "&vehicle=foot&locale=de&calc_points=true&points_encoded=false&details=surface&details=road_class&key=" + apiKeys[1].key;
    requestGH.open('GET', url);
    requestGH.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
    requestGH.onreadystatechange = function () {
        if (this.readyState === 4) {
            var json = JSON.parse(this.responseText);
            var lonlats = json.paths[0].points.coordinates;
            var latlngs = [];
            //Format LatLon tauschen für Leaflet
            for (let i = 0; i < lonlats.length; i++) {
                latlngs.push(lonlats[i].reverse());
            }

            //--Unterschiedl. Farben---------------------------------------------------------------------------------------------------------------------------                
            if ((json.paths[0].distance > 2000 && schoolType == "Grundschule") || (json.paths[0].distance > 4000 && schoolType != "Grundschule" && schoolType != "Förderschule") || (schoolType == "Förderschule" && lern1.checked && json.paths[0].distance > 2000) || (schoolType == "Förderschule" && lern5.checked && json.paths[0].distance > 4000)) {
                //gestrichelt
                var polyline = L.polyline(latlngs, {
                    className: "polyline_strich",
                    color: 'red'
                }).addTo(mymap);
            } else {
                //durchgezogen
                var polyline = L.polyline(latlngs, {
                    className: "polyline_normal",
                    color: 'red'
                }).addTo(mymap);

            }
            //-----------------------------------------------------------------------------------------------------------------------------
            polyline_layer.addLayer(polyline);
            // auf Polyline zoomen
            mymap.fitBounds(polyline.getBounds());

            var table = document.getElementById("ausgabetabelle");
            var row = table.insertRow(0);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            cell1.innerHTML = "<b>GraphHopper</b>";
            cell2.innerHTML = round((json.paths[0].distance / 1000), 3) + "km";

            getRoadClass(json);

        }
    };
    requestGH.send();
}
//MapBox Eingabeformat Koordinaten Länge Breite (LonLat)
async function getRouteMB() {
    var requestMB = new XMLHttpRequest();
    var url = "https://api.mapbox.com/directions/v5/mapbox/walking?access_token=" + apiKeys[2].key;
    requestMB.open('POST', url);
    requestMB.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
    requestMB.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    requestMB.onreadystatechange = function () {
        if (this.readyState === 4) { //DONE
            var json = JSON.parse(this.responseText);
            var lonlats = json.routes[0].geometry.coordinates;
            var latlngs = [];
            //Format LatLon tauschen
            for (let i = 0; i < lonlats.length; i++) {
                latlngs.push(lonlats[i].reverse());
            }
            //--Unterschiedl. Farben---------------------------------------------------------------------------------------------------------------------------                
            if ((json.routes[0].distance > 2000 && schoolType == "Grundschule") || (json.routes[0].distance > 4000 && schoolType != "Grundschule" && schoolType != "Förderschule") || (schoolType == "Förderschule" && lern1.checked && json.routes[0].distance > 2000) || (schoolType == "Förderschule" && lern5.checked && json.routes[0].distance > 4000)) {

                var polyline = L.polyline(latlngs, {
                    className: "polyline_strich",
                    color: 'blue'
                }).addTo(mymap);
                polyline_layer.addLayer(polyline);
            } else {
                var polyline = L.polyline(latlngs, {
                    color: 'blue'
                }).addTo(mymap);
                polyline_layer.addLayer(polyline);
            }
            //----------------------------------------------------------------------------------------------------------------------------
            mymap.fitBounds(polyline.getBounds());
            //--Anzeige Tabelle-----------------------------------------------
            var table = document.getElementById("ausgabetabelle");
            var row = table.insertRow(0);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            cell1.innerHTML = "<b>Mapbox</b>";
            cell2.innerHTML = round((json.routes[0].distance / 1000), 3) + "km";

        }
    }
    const body_MB = 'coordinates=' + start[1] + ',' + start[0] + ';' + end[1] + ',' + end[0] + '&steps=true&overview=full&geometries=geojson';
    requestMB.send(body_MB);
}

//Straßenkategorien ermitteln mit GraphHopper-Route
function getRoadClass(json) {
    //Array mit Anfangspunkt, Endpunkt und Straßenkategorie
    var roadclass_abschnitte = json.paths[0].details.road_class;
    var dist_komplett = json.paths[0].distance;
    var dist_primary = {
        "klasse": "Bundesstra&szlig;e",
        "dist": 0
    };
    var dist_secondary = {
        "klasse": "Landesstra&szlig;e",
        "dist": 0
    };
    var dist_tertiary = {
        "klasse": "Kreisstra&szlig;e",
        "dist": 0
    };
    var dist_footway = {
        "klasse": "Gehweg",
        "dist": 0
    };
    var dist_path = {
        "klasse": "Pfad",
        "dist": 0
    };
    var dist_cycle = {
        "klasse": "Radweg",
        "dist": 0
    };
    var dist_road = {
        "klasse": "unbekannte Klassifikation",
        "dist": 0
    };
    var dist_unclass = {
        "klasse": "nicht klassifiziert, Nebenstra&szlig;e",
        "dist": 0
    };
    var dist_ped = {
        "klasse": "Weg, Platz (Fu&szlig;g&auml;ngerzone)",
        "dist": 0
    };
    var dist_service = {
        "klasse": "Erschlie&szlig;ungsweg",
        "dist": 0
    };
    var dist_steps = {
        "klasse": "Stufen",
        "dist": 0
    };
    var dist_residential = {
        "klasse": "Stra&szlig;e im Wohngebiet, Anliegerstra&szlig;e",
        "dist": 0
    };
    var dist_track = {
        "klasse": "Wirtschaftsweg/Feldweg/Waldweg",
        "dist": 0
    };
    var dist_living = {
        "klasse": "Verkehrsberuhigter Bereich",
        "dist": 0
    };

    for (let i = 0; i < roadclass_abschnitte.length; i++) {
        var von = roadclass_abschnitte[i][0]; //0 (Anfangspunkt)
        var bis = roadclass_abschnitte[i][1]; //3 (Endpunkt)
        var name = roadclass_abschnitte[i][2]; //track (Straßenklasse)
        var distanz = 0;
        //Für jeden Abschnitt/jede Straßenkategorie Länge ausrechnen
        for (let x = von; x < bis; x++) {
            distanz += dist_latlon(json.paths[0].points.coordinates[x], json.paths[0].points.coordinates[(x + 1)])
        }
        //zu der zugehörigen Klasse zuordnen
        if (name == "secondary") {
            dist_secondary.dist += distanz;
        }
        if (name == "primary") {
            dist_primary.dist += distanz;
        }
        if (name == "tertiary") {
            dist_tertiary.dist += distanz;
        }
        if (name == "track") {
            dist_track.dist += distanz;
        }
        if (name == "footway") {
            dist_footway.dist += distanz;
        }
        if (name == "residential") {
            dist_residential.dist += distanz;
        }
        if (name == "path") {
            dist_path.dist += distanz;
        }
        if (name == "steps") {
            dist_steps.dist += distanz;
        }
        if (name == "unclassified") {
            dist_unclass.dist += distanz;
        }
        if (name == "service") {
            dist_service.dist += distanz;
        }
        if (name == "pedestrian") {
            dist_ped.dist += distanz;
        }
        if (name == "road") {
            dist_road.dist += distanz;
        }
        if (name == "cycleway") {
            dist_cycle.dist += distanz;
        }
        if (name == "living_street") {
            dist_living.dist += distanz;
        }

    }
    var roadclasses_unsort = [dist_primary, dist_secondary, dist_tertiary, dist_track,
        dist_road, dist_residential, dist_living, dist_cycle,
        dist_ped, dist_path, dist_service, dist_steps, dist_footway, dist_unclass
    ];

    $("#kategorienlabel").text("");
    let ueberschrift = document.createElement('p');
    ueberschrift.innerHTML = "<u>Straßentypen der gew&auml;hlten Route</u> (Powered by Graphhopper)<p>Weitere Informationen zu den verschiedenen Kategorien findet man im <a href='https://wiki.openstreetmap.org/wiki/DE:Key:highway'>OpenStreetMap-Wiki\u279A</a></p>";
    document.getElementById('kategorienlabel').appendChild(ueberschrift)
    //Tabelle mit Straßentypen erstellen und in KategorienTabelle hinzufügen
    var table = document.getElementById("kategorientabelle");
    //Kopf
    var head = table.insertRow(0);
    var head1 = head.insertCell(0);
    var head2 = head.insertCell(1);
    var head3 = head.insertCell(2);
    head1.innerHTML = "<b>Stra&szlig;entyp</b>"
    head2.innerHTML = "<b>L&auml;nge in [km]</b>"
    head3.innerHTML = "<b>Anteil in %</b>"
    var roadclasses=sort_by_key(roadclasses_unsort,"dist");
    for (let k = 0; k < roadclasses.length; k++) {
        if (roadclasses[k].dist > 0) {

            var row = table.insertRow();
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            cell1.innerHTML = roadclasses[k].klasse;
            cell2.innerHTML = round(roadclasses[k].dist / 1000, 3) + " km";
            //prozentualer Anteil
            var num = round(roadclasses[k].dist / dist_komplett, 3) * 100
            cell3.innerHTML = num.toFixed(2) + "%";
        }
    }


}

//Hilfsfunktionen

function sort_by_key(array, key)
{
 return array.sort(function(a, b)
 {
  var x = a[key]; var y = b[key];
  return ((y < x) ? -1 : ((y > x) ? 1 : 0));
 });
}


// (c) Andreas Bock https://www.netzprogrammierer.de/mit-javascript-auf-beliebige-dezimalstellen-runden/
function round(wert, dez) {
    wert = parseFloat(wert);
    if (!wert) return 0;
    dez = parseInt(dez);
    if (!dez) dez = 0;
    var umrechnungsfaktor = Math.pow(10, dez);
    return Math.round(wert * umrechnungsfaktor) / umrechnungsfaktor;
}