"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "../../../../../components/ui/button";
import { ChevronRight, ChevronLeft, Search, MapPin } from "lucide-react";
import { Inter } from "next/font/google";
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl";

const inter = Inter({ subsets: ["latin"] });

export default function Step2({ onNext, onPrev }) {
  const [viewport, setViewport] = useState({
    latitude: 14.5995, // Default: Manila
    longitude: 120.9842,
    zoom: 14,
  });

  const [marker, setMarker] = useState({
    latitude: 14.5995,
    longitude: 120.9842,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Auto locate user
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setViewport((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setMarker({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      });
    }
  }, []);

  // Debug: check token
  useEffect(() => {
    console.log("Mapbox token:", process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  }, []);

  const handleContinue = () => {
    console.log("Selected location:", marker);
    onNext();
  };

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?autocomplete=true&limit=5&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.features) {
        setSuggestions(data.features);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select suggestion
  const handleSelectSuggestion = (place) => {
    setSearchQuery(place.place_name);
    setViewport({
      latitude: place.center[1],
      longitude: place.center[0],
      zoom: 14,
    });
    setMarker({
      latitude: place.center[1],
      longitude: place.center[0],
    });
    setSuggestions([]);
  };

  // Manual search via Enter or icon
  const handleSearch = async () => {
    if (!searchQuery) return;

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();
      console.log("Search result:", data);

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setViewport((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          zoom: 14,
        }));
        setMarker({ latitude: lat, longitude: lng });
      } else {
        alert("Location not found.");
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  return (
    <div
      className={`pt-[50px] pb-[50px] flex min-h-screen items-center justify-center bg-cover bg-center px-4 ${inter.className}`}
      style={{ backgroundImage: "url('/assets/bg_register.png')" }}
    >
      <div className="relative z-10 w-full max-w-4xl text-center">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/logos/Logotype=Logotype M.png"
            alt="Logo"
            width={250}
            height={76}
            className="rounded-full mb-[30px]"
          />
          <h1 className="font-[600] text-[25px] text-center mb-[40px]">
            Let’s get your account started.
          </h1>
        </div>

        <p className="text-white text-[20px] font-[500] mb-[20px]">
          Enter your location below, or pinpoint your location automatically.
        </p>

        {/* Search Bar */}
        <div className="relative mx-auto mb-[30px] w-full max-w-[800px]">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            placeholder="Search for your location here..."
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-[57px] pl-12 pr-12 rounded-[15px] border border-[rgba(255,255,255,0.4)] bg-[#120A2A] text-white text-[16px] shadow focus:outline-none"
          />
          <MapPin
            onClick={handleSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
            size={22}
          />

          {/* Dropdown suggestions */}
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-[#120A2A] border border-[rgba(255,255,255,0.4)] rounded-[15px] shadow-lg overflow-hidden z-20">
              {suggestions.map((place) => (
                <li
                  key={place.id}
                  className="px-4 py-2 text-left text-white hover:bg-[#1a1a3d] cursor-pointer transition-colors"
                  onClick={() => handleSelectSuggestion(place)}
                >
                  {place.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map */}
        <div className="w-full max-w-[800px] h-[288px] mx-auto rounded-[30px] overflow-hidden">
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            viewState={viewport}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            onMove={(evt) => setViewport(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            onClick={(e) =>
              setMarker({ latitude: e.lngLat.lat, longitude: e.lngLat.lng })
            }
          >
            {/* marker */}
            <Marker
              latitude={marker.latitude}
              longitude={marker.longitude}
              color="#000000"
            />
            <NavigationControl position="top-left" />
            <GeolocateControl position="top-left" />
          </Map>
        </div>

        <p className="font-[500] text-[20px] text-center mb-[25px] mt-[79px]">
          Is this location correct?
        </p>

        <div className="flex justify-center mb-[47.5px]">
          <Button
            className="cursor-pointer flex w-[240px] h-[50px] justify-center items-center px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm sm:text-[20px] font-normal transition rounded-[15px]"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>

        <div className="flex justify-center items-center gap-2 text-sm text-white opacity-60">
          <ChevronLeft
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onPrev}
          />
          <span>2 of 7</span>
          <ChevronRight
            className="w-5 h-5 cursor-pointer text-gray-300 hover:text-white"
            onClick={onNext}
          />
        </div>
      </div>
    </div>
  );
}
