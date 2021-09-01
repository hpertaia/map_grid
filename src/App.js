import logo from './logo.svg';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import * as L from 'leaflet';

function App() {
	return (
		<div className='App'>
			<MapContainer
				className='map'
				center={[49.48468635922181, -125.13563599414015]}
				zoom={4}
				scrollWheelZoom={false}
			>
				<TileLayer
					attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
					url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
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

	L.tileLayer(
		'https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
		{
			attribution:
				'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		}
	).addTo(map);

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
							[-139.5703125, 60.56537850464181],
						],
					],
				},
			},
		],
	};
	const bbox = turf.bbox(bcGeo);
	let largeGrid = turf.squareGrid(bbox, 20);

	const BCLargeGrid = largeGrid.features.filter((feature) => {
		return (
			turf.booleanOverlap(bcGeo.features[0].geometry, feature) ||
			turf.booleanWithin(feature, bcGeo.features[0].geometry)
		);
	});
	let largeGridItemIndex = 0;
	const timeStart = new Date().getTime();
	BCLargeGrid.forEach((largeGridItem) => {
		const buffered = turf.buffer(largeGridItem, 40);
		const smBbox = turf.bbox(buffered);
		const smGrid = turf.squareGrid(smBbox, 20);

		// const multiStringLine = splitPoly(largeGridItem, 3, map);

		const polygons = createSmallerGrid(largeGridItem, 20, map);

		console.log(largeGridItem);
		console.log(polygons);

		// L.geoJson(polygons, {
		// 	color: 'green',
		// 	fillColor: '#ffffff',
		// 	fillOpacity: 0,
		// }).addTo(map);
		// L.geoJson(largeGridItem, {
		// 	color: 'red',
		// 	fillColor: '#ffffff',
		// 	fillOpacity: 0.5,
		// }).addTo(map);

		largeGridItemIndex++;
	});
	console.log('large grid items: ' + largeGridItemIndex);
	const timeStop = new Date().getTime();

	const totalTime = timeStop - timeStart;
	console.log(totalTime);
	return null;
};

export const createSmallerGrid = (feature, factor, map) => {
	const topLeftCoords = feature.geometry.coordinates[0][1];
	const topRightCoords = feature.geometry.coordinates[0][2];
	const bottomRightCoords = feature.geometry.coordinates[0][3];

	const verLength = (topRightCoords[0] - topLeftCoords[0]) / factor;
	const horLength = (bottomRightCoords[1] - topRightCoords[1]) / factor;

	let xDist;
	let yDist;

	let leftSide = topLeftCoords[0];
	let rightSide = topLeftCoords[0] + verLength;
	let topSide = topLeftCoords[1];
	let bottomSide = topLeftCoords[1] + horLength;

	xDist = turf.distance(
		[leftSide, topLeftCoords[1]],
		[rightSide, topLeftCoords[1]]
	);
	yDist = turf.distance([leftSide, topSide], [leftSide, bottomSide]);

	const area = xDist * yDist;
	console.log(area);

	const polyArr = [];
	for (let i = 0; i < factor; i++) {
		let leftSide = topLeftCoords[0] + verLength * i;
		let rightSide = topLeftCoords[0] + verLength * i + verLength;

		const poly1 = [
			[
				[leftSide, topLeftCoords[1] + horLength],
				[leftSide, topLeftCoords[1]],
				[rightSide, topLeftCoords[1]],
				[rightSide, topLeftCoords[1] + horLength],
				[leftSide, topLeftCoords[1] + horLength],
			],
		];
		let poly2 = [];
		for (let i = 0; i < factor; i++) {
			let topSide = topLeftCoords[1] + horLength * i;
			let bottomSide = topLeftCoords[1] + horLength * i + horLength;
			poly2 = [
				[
					[leftSide, bottomSide],
					[leftSide, topSide],
					[rightSide, topSide],
					[rightSide, bottomSide],
					[leftSide, bottomSide],
				],
			];
			const polyAct2 = turf.polygon(poly2);
			polyArr.push(polyAct2);
		}
		const polyAct = turf.polygon(poly1);
		polyArr.push(polyAct);
	}
	return polyArr;
};

export default App;
