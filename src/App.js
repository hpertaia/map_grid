import logo from './logo.svg';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import * as L from 'leaflet';

function App() {
  return (
    <div className="App">
      <MapContainer className="map" center={[49.48468635922181, -125.13563599414015]} zoom={4} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MyLayer />
      </MapContainer>
    </div>
  );
}

const MyLayer = () => {
  var map = useMap();

  map.on('click', function (e) {
    console.log(e.latlng.lat, e.latlng.lng);
    //var c = L.circle([e.latlng.lat,e.latlng.lng], {radius: 15}).addTo(map);
  });

  L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // add a marker to the map
  var bcGeo = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-139.5703125, 60.56537850464181],
              [-134.560546875, 53.72271667491848],
              [-125.859375, 47.635783590864854],
              [-113.6865234375, 48.31242790407178],
              [-113.291015625, 49.781264058178344],
              [-119.2236328125, 53.904338156274704],
              [-119.44335937499999, 60.34869562531862],
              [-139.5703125, 60.56537850464181]
            ]
          ]
        }
      }
    ]
  };
  const bbox = turf.bbox(bcGeo);
  let largeGrid = turf.squareGrid(bbox, 100);

  const BCLargeGrid = largeGrid.features.filter((feature) => {
    return (
      turf.booleanOverlap(bcGeo.features[0].geometry, feature) ||
      turf.booleanWithin(feature, bcGeo.features[0].geometry)
    );
  });

  //  largeGrid.features = overlapsBC;

  //  let largeGridItemIndex = 0;

  /*
  largeGrid.features.forEach((gridItem) => {
    largeGrid.features[largeGridItemIndex] = {
      ...largeGrid.features[largeGridItemIndex],
      gridItemId: largeGridItemIndex
    };

    //    const multiStringLine = splitPoly(gridItem, 2);
    let geoRes = gridItem;
    // console.log(geoRes);
    // multiStringLine.forEach((lineString) => {
    // 	geoRes = polygonCut(gridItem, lineString, null);
    // });
	*/

  L.geoJson(BCLargeGrid, {
    color: 'red',
    fillColor: '#ffffff',
    fillOpacity: 0.5
  }).addTo(map);

  //largeGridItemIndex++;
  //});

  /*   console.log('smallGridItemIndex: ' + smallGridItemIndex);
  console.log('largeGridItemIndex : ' + largeGridItemIndex); */

  return null;
};

// not using: drew small grid kinda
export const splitPoly = (feature, splitByNumber) => {
  const topLeftCoords = feature.geometry.coordinates[0][1];
  const topRightCoords = feature.geometry.coordinates[0][2];
  const bottomRightCoords = feature.geometry.coordinates[0][3];
  const bottomLeftCoords = feature.geometry.coordinates[0][4];

  console.log([topLeftCoords, topRightCoords, bottomLeftCoords, bottomRightCoords]);

  let lineStringArr = [];
  let multiLineString = [];
  for (let i = 1; i <= splitByNumber; i++) {
    const horSplitLongValue = topLeftCoords[1] + ((bottomLeftCoords[1] - topLeftCoords[1]) / (splitByNumber + 1)) * i;
    console.log(horSplitLongValue);

    const verSplitLongValue = topLeftCoords[0] + ((topRightCoords[0] - topLeftCoords[0]) / (splitByNumber + 1)) * i;
    console.log(verSplitLongValue);

    const horizontalSplit = [
      [topLeftCoords[0], horSplitLongValue],
      [topRightCoords[0], horSplitLongValue]
    ];

    const verticalSplit = [
      [verSplitLongValue, topLeftCoords[1]],
      [verSplitLongValue, bottomLeftCoords[1]]
    ];

    multiLineString.push(horizontalSplit);
    multiLineString.push(verticalSplit);

    // const multiline = [
    // 	[
    // 		[topLeftCoords[0], horSplitLongValue],
    // 		[topRightCoords[0], horSplitLongValue],
    // 	],
    // 	[
    // 		[topRightCoords[0], horSplitLongValue],
    // 		[topRightCoords[0] + 0.2, horSplitLongValue + 0.2],
    // 	],
    // 	[
    // 		[topRightCoords[0] + 0.2, horSplitLongValue + 0.2],
    // 		[verSplitLongValue, topLeftCoords[1]],
    // 	],
    // 	[
    // 		[verSplitLongValue, topLeftCoords[1]],
    // 		[verSplitLongValue, bottomLeftCoords[1]],
    // 	],
    // ];

    const lineStringHorizontal = turf.lineString(horizontalSplit);
    const lineStringVertical = turf.lineString(verticalSplit);
    lineStringArr.push(lineStringHorizontal);
    lineStringArr.push(lineStringVertical);
  }

  return lineStringArr;
};

// idea... had to do with the other one
export function polygonCut(polygon, line, idPrefix) {
  const THICK_LINE_UNITS = 'kilometers';
  const THICK_LINE_WIDTH = 0.001;
  var i, j, id, intersectPoints, lineCoords, forCut, forSelect;
  var thickLineString, thickLinePolygon, clipped, polyg, intersect;
  var polyCoords = [];
  var cutPolyGeoms = [];
  var cutFeatures = [];
  var offsetLine = [];
  var retVal = null;

  if ((polygon.type !== 'Polygon' && polygon.type !== 'MultiPolygon') || line.type !== 'LineString') {
    return retVal;
  }

  if (typeof idPrefix === 'undefined') {
    idPrefix = '';
  }

  intersectPoints = turf.lineIntersect(polygon, line);
  if (intersectPoints.features.length === 0) {
    return retVal;
  }

  var lineCoords = turf.getCoords(line);
  if (
    turf.booleanWithin(turf.point(lineCoords[0]), polygon) ||
    turf.booleanWithin(turf.point(lineCoords[lineCoords.length - 1]), polygon)
  ) {
    return retVal;
  }

  offsetLine[0] = turf.lineOffset(line, THICK_LINE_WIDTH, {
    units: THICK_LINE_UNITS
  });
  offsetLine[1] = turf.lineOffset(line, -THICK_LINE_WIDTH, {
    units: THICK_LINE_UNITS
  });

  for (i = 0; i <= 1; i++) {
    forCut = i;
    forSelect = (i + 1) % 2;
    polyCoords = [];
    for (j = 0; j < line.coordinates.length; j++) {
      polyCoords.push(line.coordinates[j]);
    }
    for (j = offsetLine[forCut].geometry.coordinates.length - 1; j >= 0; j--) {
      polyCoords.push(offsetLine[forCut].geometry.coordinates[j]);
    }
    polyCoords.push(line.coordinates[0]);

    thickLineString = turf.lineString(polyCoords);
    thickLinePolygon = turf.lineToPolygon(thickLineString);
    clipped = turf.difference(polygon, thickLinePolygon);

    cutPolyGeoms = [];
    for (j = 0; j < clipped.geometry.coordinates.length; j++) {
      polyg = turf.polygon(clipped.geometry.coordinates[j]);
      intersect = turf.lineIntersect(polyg, offsetLine[forSelect]);
      if (intersect.features.length > 0) {
        cutPolyGeoms.push(polyg.geometry.coordinates);
      }
    }

    cutPolyGeoms.forEach(function (geometry, index) {
      id = idPrefix + (i + 1) + '.' + (index + 1);
      cutFeatures.push(turf.polygon(geometry, { id: id }));
    });
  }

  if (cutFeatures.length > 0) retVal = turf.featureCollection(cutFeatures);

  return retVal;
}

export default App;
