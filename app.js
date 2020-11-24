let categoriesColors = {}

mapboxgl.accessToken = "pk.eyJ1IjoicmFhbXl5IiwiYSI6ImNraHZsdWF3YzAwdW4yeG54ZnBpd2gyNWkifQ.jwEu0a_fv2swA8uMqHUoIw"
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    zoom: 1.5,
});

fetch("https://eonet.sci.gsfc.nasa.gov/api/v2.1/events")
    .then(response => response.json())
    .then(data => {
        const { events } = data;
        events.forEach(event => {
            processEvent(event);
        })
    }).then(() => { console.log(categoriesColors); })

function getEventId(event) {
    return event.categories[0].id;
}
function processEvent(event) {

    var popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `
        <p>${event.id}</p>
        <h2>${event.title}</h2>
        <h4>${event.categories[0].title}</h4>
        <a href="${event.sources[0].url}">incident link</a>
        `
    );


    if (event.geometries.length == 1) {
        if (event.geometries[0].type == "Point") {
            drawPointMarker(event.geometries[0], popup, event);
        }
        //TODO: else draw polygon
    }
    else {
        const linePoints = event.geometries.map(geometry => geometry.coordinates);
        drawLine(linePoints, event, popup)
    }

}

function drawPointMarker(geometry, popup, event) {
    new mapboxgl.Marker({ color: getColor(event) })
        .setLngLat(geometry.coordinates)
        .addTo(map)
        .setPopup(popup);
}

function drawLine(linePoints, event, popup) {
    map.addSource(event.id, {
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
        'id': event.id,
        'type': 'line',
        'source': event.id,
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': getColor(event),
            'line-width': 8
        }
    });

    map.on('click', event.id, function (e) {
        console.log(popup)
        popup
            .setLngLat(e.lngLat)
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', event.id, function () {
        map.getCanvas().style.cursor = 'pointer';
        map.setPaintProperty(event.id, 'line-opacity', 0.8);

    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', event.id, function () {
        map.getCanvas().style.cursor = '';
        map.setPaintProperty(event.id, 'line-opacity', 1);
    });
}

function getColor(event) {
    const eventCategory = event.categories[0];
    categoriesColors[eventCategory.id] = categoriesColors[eventCategory.id] || getRandomColor();
    return categoriesColors[eventCategory.id];
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}