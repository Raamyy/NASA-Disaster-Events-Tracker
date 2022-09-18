let categoriesColors = {}

mapboxgl.accessToken = "pk.eyJ1IjoicmFhbXl5IiwiYSI6ImNraHZzcTZnOTBpYWkzNG1vcnJ6MWczeGkifQ.2tohguwZmtkbsO3MwUbYHw"
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    zoom: 1.5,
});

fetch("https://eonet.gsfc.nasa.gov/api/v2.1/events")
    .then(response => response.json())
    .then(data => {
        const { events } = data;
        events.forEach(accidentEvent => {
            processaccidentEvent(accidentEvent);
        })
    }).then(() => { console.log(categoriesColors); })

function getaccidentEventId(accidentEvent) {
    return accidentEvent.categories[0].id;
}
function processaccidentEvent(accidentEvent) {

    var popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `
        <p>${accidentEvent.id}</p>
        <h2>${accidentEvent.title}</h2>
        <h4>${accidentEvent.categories[0].title}</h4>
        <a href="${accidentEvent.sources[0].url}">incident link</a>
        `
    );

    if (accidentEvent.geometries.length == 1) {
        if (accidentEvent.geometries[0].type == "Point") {
            drawPointMarker(accidentEvent.geometries[0], popup, accidentEvent);
        }
        else if (accidentEvent.geometries[0].type == "Polygon") {
            drawPolygon(accidentEvent.geometries[0].coordinates, accidentEvent, popup)
        }
    }
    else {
        const linePoints = accidentEvent.geometries.map(geometry => geometry.coordinates);
        drawLine(linePoints, accidentEvent, popup)
    }

}

function drawPointMarker(geometry, popup, accidentEvent) {
    new mapboxgl.Marker({ color: getColor(accidentEvent) })
        .setLngLat(geometry.coordinates)
        .addTo(map)
        .setPopup(popup);
}

function drawLine(linePoints, accidentEvent, popup) {
    map.addSource(accidentEvent.id, {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': linePoints
            }
        }
    });

    map.addLayer({
        'id': accidentEvent.id,
        'type': 'line',
        'source': accidentEvent.id,
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': getColor(accidentEvent),
            'line-width': 8
        }
    });

    map.on('click', accidentEvent.id, function (e) {
        console.log(popup)
        popup
            .setLngLat(e.lngLat)
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', accidentEvent.id, function () {
        map.getCanvas().style.cursor = 'pointer';
        map.setPaintProperty(accidentEvent.id, 'line-opacity', 0.8);

    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', accidentEvent.id, function () {
        map.getCanvas().style.cursor = '';
        map.setPaintProperty(accidentEvent.id, 'line-opacity', 1);
    });
}

function drawPolygon(geometry, accidentEvent, popup) {
    map.addSource(accidentEvent.id, {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'Polygon',
                'coordinates': geometry.coordinates
            }
        }
    });

    map.addLayer({
        'id': accidentEvent.id,
        'type': 'line',
        'source': accidentEvent.id,
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': getColor(accidentEvent),
            'line-width': 8
        }
    });

    map.on('click', accidentEvent.id, function (e) {
        console.log(popup)
        popup
            .setLngLat(e.lngLat)
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', accidentEvent.id, function () {
        map.getCanvas().style.cursor = 'pointer';
        map.setPaintProperty(accidentEvent.id, 'line-opacity', 0.8);

    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', accidentEvent.id, function () {
        map.getCanvas().style.cursor = '';
        map.setPaintProperty(accidentEvent.id, 'line-opacity', 1);
    });
}



function getColor(accidentEvent) {
    const accidentEventCategory = accidentEvent.categories[0];
    categoriesColors[accidentEventCategory.id] = categoriesColors[accidentEventCategory.id] || getRandomColor();
    return categoriesColors[accidentEventCategory.id];
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}