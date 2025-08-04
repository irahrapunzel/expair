"use client";

import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from "lucide-react";

export default function DynamicMap({ viewport, onViewportChange, marker, onMarkerChange }) {

  const handleMapClick = (event) => {
    if (onMarkerChange) {
      onMarkerChange({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
      });
    }
  };

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      viewState={viewport}
      onMove={evt => onViewportChange(evt.viewState)}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '100%' }}
      onClick={handleMapClick}
    >
      {marker && (
        <Marker
          latitude={marker.latitude}
          longitude={marker.longitude}
          offsetLeft={-20}
          offsetTop={-40}
        >
          <MapPin size={40} className="text-[#000000]" fill="#000000" />
        </Marker>
      )}
      <NavigationControl position="top-left" />
      <GeolocateControl 
        position="top-left" 
        onGeolocate={(e) => {
          if (onMarkerChange) {
            onMarkerChange({
              longitude: e.coords.longitude,
              latitude: e.coords.latitude
            });
          }
        }}
      />
    </Map>
  );
}
