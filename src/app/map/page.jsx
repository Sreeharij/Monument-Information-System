"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore methods
import { db, storage } from '../../firebaseConfig'; // Import your Firebase configuration
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage'; // Import Storage methods

const MapPage = () => {
  const router = useRouter();
  const [monuments, setMonuments] = useState([]);

  useEffect(() => {
    const fetchMonuments = async () => {
      try {
        const all_monuments = [];
        const querySnapshot = await getDocs(collection(db, "monuments"));
        querySnapshot.forEach((doc) => {
          all_monuments.push({
            Name: doc.data().Name,
            Coordinates: doc.data().Coordinates,
            Description: doc.data().Description,
            ImageUrl: "",
          });
        });

        const storageRef = ref(storage, "photos");
        const result = await listAll(storageRef);

        const photo_data_promises = result.items.map(async (imageRef) => {
          const url = await getDownloadURL(imageRef);
          const metadata = await getMetadata(imageRef);
          const lastDotIndex = metadata.name.lastIndexOf('.');
          const name = lastDotIndex != -1 ? metadata.name.substring(0, lastDotIndex) : metadata.name;
          return { url, name };
        });
        const photoData = await Promise.all(photo_data_promises);

        all_monuments.forEach((monument) => {
          const photo = photoData.find((photo) => photo.name == monument.Name);
          if (photo) {
            monument.ImageUrl = photo.url;
          }
        });

        setMonuments(all_monuments);
      } catch (error) {
        console.error("Error fetching monuments:", error);
      }
    };

    fetchMonuments();
  }, []);

  useEffect(() => {
    console.log("Monuments:", monuments);
    const initMap = async () => {
      console.log("Initializing map...");
      const { Map } = await google.maps.importLibrary('maps');
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

      const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        mapId: 'cfc4889586555ed7',
      });

      monuments.forEach(monument => {
        const [lat, lng] = monument.Coordinates.split(' ').map(coord => parseFloat(coord));
        const iconImage = document.createElement('img');
        iconImage.src = "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png";

        const contentString = `
          <div id="content">
            <h1 id="firstHeading" class="firstHeading">${monument.Name}</h1>
            <div id="bodyContent">
              <img src="${monument.ImageUrl}" alt="${monument.Name}" style="display: block;margin: 0 auto;max-width:100px;max-height:100px;width:auto;height:auto;">
              <p>${monument.Description}</p>
            </div>
          </div>
        `;

        const infowindow = new google.maps.InfoWindow({
          content: contentString,
          ariaLabel: monument.Name,
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          content: iconImage,
          title: monument.Name,
          position: { lat, lng },
        });
        console.log("Marker created:", marker);

        marker.addListener('click', () => {
          infowindow.open({
            anchor: marker,
            map,
          });
        });
      });
    };

    window.initMap = initMap;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GMAP_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [monuments]);

  const goHome = () => {
    router.push('/');
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <button
        onClick={goHome}
        style={{
          position: 'absolute',
          top: '10px',
          left: '900px',
          zIndex: '10',
          backgroundColor: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        }}
      >
        Home
      </button>
      <h1 style={{ position: 'absolute', top: '10px', right: '10px', zIndex: '10', color: 'white', background: 'rgba(0, 0, 0, 0.5)', padding: '5px 10px', borderRadius: '5px' }}>Let's travel through History</h1>
      <div id="map" style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
};

export default MapPage;
