
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { GoogleGenAI, Type } from "@google/genai";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { 
  MapPin, 
  Utensils, 
  Hotel, 
  ExternalLink, 
  Save, 
  Download, 
  FolderOpen, 
  X, 
  Trash2, 
  Globe,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Translation Dictionary ---
const translations = {
  en: {
    title: "Yuda AI Travel Planner",
    subtitle: "Let Yuda AI craft your next perfect getaway.",
    destinationLabel: "Destination",
    destinationPlaceholder: "e.g., Paris, France",
    interestsLabel: "Interests (optional)",
    interestsPlaceholder: "e.g., historical sites, local cuisine, hiking",
    generatePlan: "Generate Plan",
    planningTrip: "Planning your trip...",
    loadTrips: "Load Trips",
    loadingMsg1: "Generating your personalized travel plan...",
    loadingMsg2: "Creating a unique visual for your trip...",
    loadingMsg3: "Finding the best images for each location...",
    errorPrefix: "Oops!",
    errorContent: "Sorry, I couldn't generate a travel plan. The model might be busy or the request could not be fulfilled. Please try again with a different destination or adjust your interests.",
    saveTrip: "Save This Trip",
    exportPdf: "Export as PDF",
    exportingPdf: "Exporting PDF...",
    printTrip: "Print / Save PDF",
    tripSaved: "Trip saved successfully!",
    yourTripTo: "Your trip to",
    placesToVisit: "Places to Visit",
    restaurants: "Restaurants",
    accommodations: "Accommodations",
    mapOverview: "Trip Overview Map",
    savedTripsTitle: "Your Saved Trips",
    noSavedTrips: "You have no saved trips yet.",
    noInterests: "No interests specified",
    load: "Load",
    learnMore: "Learn More",
    bookNow: "Book Now",
    visitWebsite: "Visit Website",
    source: "Source",
    mapError: "Error loading map. Please ensure the Google Maps API key is configured correctly.",
    mapLoading: "Loading Map...",
    translatingTrip: "Translating your trip...",
    translationError: "Sorry, could not translate the trip details. Please try again.",
    switchLang: "English"
  },
  he: {
    title: "מתכנן הטיולים של Yuda AI",
    subtitle: "תנו ליודה AI לתכנן לכם את החופשה המושלמת הבאה.",
    destinationLabel: "יעד",
    destinationPlaceholder: "לדוגמה, פריז, צרפת",
    interestsLabel: "תחומי עניין (אופציונלי)",
    interestsPlaceholder: "לדוגמה, אתרים היסטוריים, מטבח מקומי, טיולים",
    generatePlan: "צור תוכנית",
    planningTrip: "מתכנן את הטיול שלך...",
    loadTrips: "טען טיולים",
    loadingMsg1: "יוצר תוכנית טיול אישית עבורך...",
    loadingMsg2: "יוצר קולאז' ייחודי לטיול שלך...",
    loadingMsg3: "מוצא את התמונות הטובות ביותר לכל מיקום...",
    errorPrefix: "אופס!",
    errorContent: "מצטערים, לא הצלחנו ליצור תוכנית טיול. ייתכן שהמודל עסוק או שהבקשה נכשלה. אנא נסו שוב עם יעד אחר או שנו את תחומי העניין.",
    saveTrip: "שמור את הטיול",
    exportPdf: "ייצא כ-PDF",
    exportingPdf: "מייצא PDF...",
    printTrip: "הדפס / שמור כ-PDF",
    tripSaved: "הטיול נשמר בהצלחה!",
    yourTripTo: "הטיול שלך ל",
    placesToVisit: "מקומות לביקור",
    restaurants: "מסעדות",
    accommodations: "מקומות לינה",
    mapOverview: "מפת הטיול",
    savedTripsTitle: "הטיולים השמורים שלך",
    noSavedTrips: "אין לך טיולים שמורים עדיין.",
    noInterests: "לא צוינו תחומי עניין",
    load: "טען",
    learnMore: "למידע נוסף",
    bookNow: "הזמן עכשיו",
    visitWebsite: "בקר באתר",
    source: "מקור",
    mapError: "שגיאה בטעינת המפה. אנא ודא שמפתח ה-API של מפות גוגל הוגדר כראוי.",
    mapLoading: "טוען מפה...",
    translatingTrip: "מתרגם את הטיול שלך...",
    translationError: "מצטערים, לא ניתן היה לתרגם את פרטי הטיול. אנא נסה שוב.",
    switchLang: "עברית"
  }
};

// --- Interfaces for our data structure ---
interface Location {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  images: { imageUrl: string; pageUrl: string; }[];
  infoUrl?: string; // For places to visit
  bookingUrl?: string; // For accommodations
  websiteUrl?: string; // For restaurants
}

interface TravelPlan {
  placesToVisit: Location[];
  restaurants: Location[];
  accommodations: Location[];
}

interface SavedTrip {
  id: number;
  destination: string;
  interests: string;
  travelPlan: TravelPlan;
  generationLanguage: 'en' | 'he';
  collageImageUrl: string | null;
}

// --- SVG Icon Components ---
const PlacesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RestaurantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M11.25 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-7.5 0h7.5" />
    </svg>
);

const AccommodationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ltr:ml-1 rtl:mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const MapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0 6l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 10v-6m0 6l-6-3m6 3V7" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ltr:mr-2 rtl:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ltr:mr-2 rtl:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const LoadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ltr:mr-2 rtl:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


// --- Define a props interface for LocationCard to resolve TypeScript errors with the 'key' prop.
interface LocationCardProps {
    location: Location;
    colorClass: string;
    t: (key: keyof typeof translations.en) => string;
}

// --- Image API Helper ---
const getWikimediaImageUrls = async (query: string, destination: string): Promise<{ imageUrl: string; pageUrl: string; }[]> => {
    try {
        // First, try to find a relevant Wikipedia page.
        const searchTerm = `${query}, ${destination}`;
        const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=1&format=json&origin=*`;
        const wikiSearchResponse = await fetch(wikiSearchUrl);
        if (!wikiSearchResponse.ok) throw new Error('Wikipedia search failed');
        const wikiSearchData = await wikiSearchResponse.json();
        const page = wikiSearchData.query?.search?.[0];

        let images: { imageUrl: string; pageUrl: string; }[] = [];
        let pageTitle = query; // Fallback to original query
        
        if (page) {
            pageTitle = page.title;
            const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;

            // Get the main image for the Wikipedia page
            const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=400&format=json&origin=*`;
            const imageResponse = await fetch(imageUrl);
            const imageData = await imageResponse.json();
            const pages = imageData.query?.pages;
            if (pages) {
                const pageId = Object.keys(pages)[0];
                const mainImage = pages[pageId]?.thumbnail?.source;
                if (mainImage) {
                    images.push({ imageUrl: mainImage, pageUrl: pageUrl });
                }
            }
        }
        
        // Use the best available title to search Wikimedia Commons for more images
        const commonsSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(pageTitle)}&srnamespace=6&srlimit=5&format=json&origin=*`;
        const commonsResponse = await fetch(commonsSearchUrl);
        const commonsData = await commonsResponse.json();
        const fileTitles = commonsData.query?.search
            ?.map((item: any) => item.title)
            .filter((title: string) => /\.(jpg|jpeg|png|gif|svg)$/i.test(title));

        if (fileTitles && fileTitles.length > 0) {
            const titlesToFetch = fileTitles.slice(0, 3).join('|'); // Fetch info for a few candidates
            const infoUrl = `https://www.mediawiki.org/w/api.php?action=query&titles=${encodeURIComponent(titlesToFetch)}&prop=imageinfo&iiprop=url|descriptionurl&iiurlwidth=400&format=json&origin=*`;
            const infoResponse = await fetch(infoUrl);
            const infoData = await infoResponse.json();
            const commonsPages = infoData.query?.pages;

            if (commonsPages) {
                 for (const page of Object.values(commonsPages) as any[]) {
                    if (images.length >= 2) break;
                    const imgUrl = page.imageinfo?.[0]?.thumburl;
                    // Avoid duplicates
                    if (imgUrl && !images.some(i => i.imageUrl === imgUrl)) {
                         images.push({
                            imageUrl: imgUrl,
                            pageUrl: page.imageinfo[0].descriptionurl
                        });
                    }
                }
            }
        }

        // Fill with seeded placeholders if we still don't have 2 images
        while (images.length < 2) {
            const seed = `${query.replace(/[\s,.]/g, '')}${destination.replace(/[\s,.]/g, '')}${images.length + 1}`;
            images.push({ imageUrl: `https://picsum.photos/seed/${seed}/400/300`, pageUrl: '#' });
        }

        return images.slice(0, 2);

    } catch (error) {
        console.error(`Error fetching images for "${query}":`, error);
        // Fallback to placeholders on any error
        const seed1 = `${query.replace(/[\s,.]/g, '')}99`;
        const seed2 = `${query.replace(/[\s,.]/g, '')}98`;
        return [
            { imageUrl: `https://picsum.photos/seed/${seed1}/400/300`, pageUrl: '#' },
            { imageUrl: `https://picsum.photos/seed/${seed2}/400/300`, pageUrl: '#' }
        ];
    }
};


// --- Location Card Component ---
const LocationCard: React.FC<LocationCardProps> = ({ location, colorClass, t }) => {
    const ctaUrl = location.bookingUrl || location.websiteUrl || location.infoUrl;
    let ctaText = t('learnMore');
    if (location.bookingUrl) ctaText = t('bookNow');
    else if (location.websiteUrl) ctaText = t('visitWebsite');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="location-card bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full"
        >
            <div className="grid grid-cols-2 gap-px bg-gray-200 h-48 sm:h-56">
                <div className="bg-white relative group overflow-hidden">
                    <img 
                      src={location.images[0]?.imageUrl || 'https://picsum.photos/seed/location1/350/250'} 
                      alt={location.name} 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {location.images[0]?.pageUrl && location.images[0].pageUrl !== '#' && (
                       <a href={location.images[0].pageUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm flex items-center justify-center gap-1">
                           {t('source')} <ExternalLink size={10} />
                       </a>
                   )}
                </div>
                <div className="bg-white relative group overflow-hidden">
                    <img 
                      src={location.images[1]?.imageUrl || 'https://picsum.photos/seed/location2/350/250'} 
                      alt={location.name} 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {location.images[1]?.pageUrl && location.images[1].pageUrl !== '#' && (
                       <a href={location.images[1].pageUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm flex items-center justify-center gap-1">
                          {t('source')} <ExternalLink size={10} />
                       </a>
                   )}
                </div>
            </div>
            <div className="p-5 flex-grow flex flex-col">
                <h3 className={`text-xl font-bold tracking-tight mb-2 ${colorClass}`}>{location.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-grow line-clamp-4">{location.description}</p>
                {ctaUrl && (
                    <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      {ctaText} <ExternalLink size={14}/>
                    </a>
                )}
            </div>
        </motion.div>
    );
};

// --- Google Map Component ---
interface TripMapProps {
    plan: TravelPlan;
    t: (key: keyof typeof translations.en) => string;
}
const mapContainerStyle = { width: '100%', height: '500px' };

const ICONS = {
    place: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: '#4f46e5', // Indigo-600
    },
    restaurant: {
        path: 'M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9ZM16,6V14H18.5V22H21V2C18.24,2 16,4.24 16,6Z',
        fillColor: '#d97706', // Amber-600
    },
    accommodation: {
        path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z',
        fillColor: '#059669', // Emerald-600
    }
};

const TripMap: React.FC<TripMapProps> = ({ plan, t }) => {
    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || '') as string;
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
    });
    const [activeMarker, setActiveMarker] = useState<Location | null>(null);
    const mapRef = useRef<any | null>(null);

    const allLocations = [...plan.placesToVisit, ...plan.restaurants, ...plan.accommodations];

    const onLoad = useCallback((map: any) => {
        const bounds = new (window as any).google.maps.LatLngBounds();
        allLocations.forEach(({ latitude, longitude }) => {
            bounds.extend(new (window as any).google.maps.LatLng(latitude, longitude));
        });
        if(allLocations.length > 0) {
            map.fitBounds(bounds);
        }
        mapRef.current = map;
    }, [allLocations]);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    const getIconForCategory = (category: 'place' | 'restaurant' | 'accommodation') => {
        const iconDetails = ICONS[category];
        return {
            path: iconDetails.path,
            fillColor: iconDetails.fillColor,
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            rotation: 0,
            scale: 1.5,
            anchor: new (window as any).google.maps.Point(12, 24),
        };
    };

    if (!apiKey || loadError) return <div className="p-8 text-center text-amber-800 bg-amber-50 rounded-2xl border border-amber-200 font-medium">{t('mapError')}</div>;
    if (!isLoaded) return <div className="p-8 text-center text-gray-500 font-medium">{t('mapLoading')}</div>;
    
    return (
        <GoogleMap mapContainerStyle={mapContainerStyle} onLoad={onLoad} onUnmount={onUnmount} options={{disableDefaultUI: true, zoomControl: true}}>
            {plan.placesToVisit.map((loc, i) => <Marker key={`p-${i}`} position={{ lat: loc.latitude, lng: loc.longitude }} icon={getIconForCategory('place')} onClick={() => setActiveMarker(loc)} />)}
            {plan.restaurants.map((loc, i) => <Marker key={`r-${i}`} position={{ lat: loc.latitude, lng: loc.longitude }} icon={getIconForCategory('restaurant')} onClick={() => setActiveMarker(loc)} />)}
            {plan.accommodations.map((loc, i) => <Marker key={`a-${i}`} position={{ lat: loc.latitude, lng: loc.longitude }} icon={getIconForCategory('accommodation')} onClick={() => setActiveMarker(loc)} />)}

            {activeMarker && (
                <InfoWindow position={{ lat: activeMarker.latitude, lng: activeMarker.longitude }} onCloseClick={() => setActiveMarker(null)}>
                    <div className="p-1">
                        <h4 className="font-bold text-gray-800">{activeMarker.name}</h4>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
};

// --- Load Trips Modal Component ---
interface LoadTripsModalProps {
    savedTrips: SavedTrip[];
    onLoad: (trip: SavedTrip) => void;
    onDelete: (tripId: number) => void;
    onClose: () => void;
    t: (key: keyof typeof translations.en) => string;
}

const LoadTripsModal: React.FC<LoadTripsModalProps> = ({ savedTrips, onLoad, onDelete, onClose, t }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 overflow-hidden flex flex-col max-h-[80vh]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FolderOpen className="text-indigo-600" />
                        {t('savedTripsTitle')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                    {savedTrips.length > 0 ? (
                        savedTrips.map(trip => (
                            <div key={trip.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center bg-gray-50/50 hover:bg-indigo-50/50 transition-colors group">
                                <div className="min-w-0 flex-grow mr-4">
                                    <h3 className="font-bold text-gray-900 truncate">{trip.destination}</h3>
                                    <p className="text-xs text-gray-500 truncate">{trip.interests || t('noInterests')}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button 
                                        onClick={() => onLoad(trip)} 
                                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors shadow-sm"
                                    >
                                        {t('load')}
                                    </button>
                                    <button 
                                        onClick={() => onDelete(trip.id)} 
                                        className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete trip"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <FolderOpen className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500 font-medium">{t('noSavedTrips')}</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- Language Switcher ---
interface LanguageSwitcherProps {
  language: 'en' | 'he';
  setLanguage: (lang: 'en' | 'he') => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ language, setLanguage }) => {
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  return (
    <div className="absolute top-4 left-4 z-20">
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-2 h-10 px-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 font-bold text-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-sm"
        aria-label={`Switch to ${language === 'en' ? 'Hebrew' : 'English'}`}
      >
        <Globe size={18} />
        {language === 'en' ? 'EN' : 'HE'}
      </button>
    </div>
  );
};


// --- Main App Component ---
// Helper to extract JSON from model response
const extractJson = (text: string): string => {
    let cleaned = text.trim();
    // Remove common markdown wrappers
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Fallback: find the first { or [ and the last } or ]
    const startObj = cleaned.indexOf('{');
    const startArray = cleaned.indexOf('[');
    let start = -1;
    if (startObj !== -1 && startArray !== -1) start = Math.min(startObj, startArray);
    else if (startObj !== -1) start = startObj;
    else if (startArray !== -1) start = startArray;

    const endObj = cleaned.lastIndexOf('}');
    const endArray = cleaned.lastIndexOf(']');
    let end = -1;
    if (endObj !== -1 && endArray !== -1) end = Math.max(endObj, endArray);
    else if (endObj !== -1) end = endObj;
    else if (endArray !== -1) end = endArray;

    if (start !== -1 && end !== -1 && end > start) {
        return cleaned.substring(start, end + 1);
    }
    
    return cleaned;
};

const App = () => {
    const [destination, setDestination] = useState('');
    const [interests, setInterests] = useState('');
    const [originalTravelPlan, setOriginalTravelPlan] = useState<TravelPlan | null>(null);
    const [displayTravelPlan, setDisplayTravelPlan] = useState<TravelPlan | null>(null);
    const [displayDestination, setDisplayDestination] = useState('');
    const [translatedData, setTranslatedData] = useState<{ plan: TravelPlan; destination: string; } | null>(null);
    const [generationLanguage, setGenerationLanguage] = useState<'en' | 'he'>('en');
    const [collageImageUrl, setCollageImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<'en' | 'he'>('en');

    const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    const t = useCallback((key: keyof typeof translations.en) => {
        return translations[language][key] || translations.en[key];
    }, [language]);
    
    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    }, [language]);
    
    useEffect(() => {
        try {
            const storedTrips = localStorage.getItem('yuda-travel-plans');
            if (storedTrips) {
                setSavedTrips(JSON.parse(storedTrips));
            }
        } catch (error) {
            console.error("Failed to load saved trips:", error);
            localStorage.removeItem('yuda-travel-plans');
        }
    }, []);

    useEffect(() => {
        if (!originalTravelPlan) return;

        // If current language is the one the plan was generated in, show the original.
        if (language === generationLanguage) {
            setDisplayTravelPlan(originalTravelPlan);
            setDisplayDestination(destination);
            return;
        }

        // If we are switching to the other language and have a cached translation, use it.
        if (translatedData) {
            setDisplayTravelPlan(translatedData.plan);
            setDisplayDestination(translatedData.destination);
            return;
        }

        // If no translation is cached, generate it.
        const translatePlan = async () => {
            setIsTranslating(true);
            setError(null);

            const textsToTranslate: Record<string, string> = {
                destination: destination
            };
            originalTravelPlan.placesToVisit.forEach((loc, index) => {
                textsToTranslate[`p_n_${index}`] = loc.name;
                textsToTranslate[`p_d_${index}`] = loc.description;
            });
            originalTravelPlan.restaurants.forEach((loc, index) => {
                textsToTranslate[`r_n_${index}`] = loc.name;
                textsToTranslate[`r_d_${index}`] = loc.description;
            });
            originalTravelPlan.accommodations.forEach((loc, index) => {
                textsToTranslate[`a_n_${index}`] = loc.name;
                textsToTranslate[`a_d_${index}`] = loc.description;
            });

            try {
                const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '') as string;
                if (!apiKey) {
                    console.warn("Gemini API key is not configured for translation.");
                    return;
                }
                const ai = new GoogleGenAI({ apiKey });
                const sourceLangName = generationLanguage === 'he' ? 'Hebrew' : 'English';
                const targetLangName = language === 'he' ? 'Hebrew' : 'English';

                const prompt = `Translate this JSON of travel data from ${sourceLangName} to ${targetLangName}. Maintain keys exactly. Return JSON only.\n\n${JSON.stringify(textsToTranslate)}`;

                const response = await ai.models.generateContent({
                    model: "gemini-3.8-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                    },
                });

                const translatedTexts = JSON.parse(extractJson(response.text)) as Record<string, string>;
                const translatedDestination = translatedTexts['destination'] || destination;
                const translatedPlan = JSON.parse(JSON.stringify(originalTravelPlan)); // deep copy

                translatedPlan.placesToVisit.forEach((loc: Location, index: number) => {
                    loc.name = translatedTexts[`p_n_${index}`] || loc.name;
                    loc.description = translatedTexts[`p_d_${index}`] || loc.description;
                });
                translatedPlan.restaurants.forEach((loc: Location, index: number) => {
                    loc.name = translatedTexts[`r_n_${index}`] || loc.name;
                    loc.description = translatedTexts[`r_d_${index}`] || loc.description;
                });
                translatedPlan.accommodations.forEach((loc: Location, index: number) => {
                    loc.name = translatedTexts[`a_n_${index}`] || loc.name;
                    loc.description = translatedTexts[`a_d_${index}`] || loc.description;
                });
                
                setTranslatedData({ plan: translatedPlan, destination: translatedDestination }); // Cache the new translation
                setDisplayTravelPlan(translatedPlan);
                setDisplayDestination(translatedDestination);
            } catch (err) {
                console.error("Translation failed:", err);
                setError(t('translationError'));
                setDisplayTravelPlan(originalTravelPlan); // Fallback to original
                setDisplayDestination(destination); // Fallback destination
            } finally {
                setIsTranslating(false);
            }
        };

        translatePlan();

    }, [language, originalTravelPlan, generationLanguage, t, translatedData, destination]);


    const handleSaveTrip = () => {
        if (!originalTravelPlan || !destination) return;
        
        const tripExists = savedTrips.some(
            trip => trip.destination === destination && trip.interests === interests
        );

        if (tripExists) {
             setShowSaveConfirmation(true);
             setTimeout(() => setShowSaveConfirmation(false), 3000);
            return;
        }

        const newTrip: SavedTrip = {
            id: Date.now(),
            destination,
            interests,
            travelPlan: originalTravelPlan,
            generationLanguage: generationLanguage,
            collageImageUrl,
        };

        const updatedTrips = [...savedTrips, newTrip];
        setSavedTrips(updatedTrips);
        localStorage.setItem('yuda-travel-plans', JSON.stringify(updatedTrips));

        setShowSaveConfirmation(true);
        setTimeout(() => setShowSaveConfirmation(false), 3000);
    };

    const handleLoadTrip = (trip: SavedTrip) => {
        setDestination(trip.destination);
        setDisplayDestination(trip.destination);
        setInterests(trip.interests);
        setOriginalTravelPlan(trip.travelPlan);
        setGenerationLanguage(trip.generationLanguage || 'en');
        setCollageImageUrl(trip.collageImageUrl);
        setTranslatedData(null); // Reset translation cache
        setIsLoadModalOpen(false);
        setError(null);
        setLoading(false);
        setTimeout(() => document.getElementById('trip-visualization')?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleDeleteTrip = (tripId: number) => {
        const updatedTrips = savedTrips.filter(trip => trip.id !== tripId);
        setSavedTrips(updatedTrips);
        localStorage.setItem('yuda-travel-plans', JSON.stringify(updatedTrips));
    };

    const handlePrintTrip = () => {
        window.print();
    };

    const handleExportPdf = async () => {
        const printableContent = document.querySelector('.printable-content') as HTMLElement;
        if (!printableContent || isExporting) {
            return;
        }

        setIsExporting(true);
        setError(null);

        try {
            const [{ jsPDF }, html2canvasModule] = await Promise.all([
                import('jspdf'),
                import('html2canvas-pro')
            ]);
            const html2canvas: any = (html2canvasModule as any).default || html2canvasModule;

            const canvas = await html2canvas(printableContent, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: '#ffffff',
                ignoreElements: (element: Element) => {
                    return element.id === 'trip-actions' || element.getAttribute('role') === 'alert';
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const contentWidth = pageWidth - (margin * 2);
            const contentHeight = pageHeight - (margin * 2);

            const imgHeight = contentWidth * (canvas.height / canvas.width);
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', margin, margin + position, contentWidth, imgHeight);
            heightLeft -= contentHeight;

            while (heightLeft > 0) {
                position -= contentHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', margin, margin + position, contentWidth, imgHeight);
                heightLeft -= contentHeight;
            }

            const cleanDest = (displayDestination || destination || 'Plan')
                .trim()
                .replace(/[^a-zA-Z0-9\u0590-\u05FF_-]/g, '_');
            const fileName = `Yuda-Trip-${cleanDest}.pdf`;
            pdf.save(fileName);

        } catch (err: any) {
            console.error("PDF Export Error, opening print fallback:", err);
            try {
                window.print();
            } catch (printErr) {
                setError(language === 'he' 
                    ? `שגיאה בייצוא ה-PDF (${err?.message || ''}). ניתן להשתמש בהדפסה כ-PDF מהדפדפן.`
                    : `Error exporting PDF (${err?.message || ''}). You can use browser print to save as PDF.`);
            }
        } finally {
            setIsExporting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!destination.trim()) {
            setError(t('destinationLabel') + ' is required.'); // Simple validation message
            return;
        }
        setLoading(true);
        setError(null);
        setOriginalTravelPlan(null);
        setDisplayTravelPlan(null);
        setCollageImageUrl(null);
        setTranslatedData(null);

        try {
            const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '') as string;
            if (!apiKey) {
                setError(language === 'he' 
                    ? 'מפתח Gemini API אינו מוגדר. אנא ודא שהוספת את המפתח GEMINI_API_KEY ב-GitHub Secrets ובצע Build/Deploy מחדש.' 
                    : 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is added to GitHub Secrets and re-run deployment.');
                setLoading(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey });
            
            setLoadingMessage(t('loadingMsg1'));
            const langInstruction = `IMPORTANT: The entire response, including all names and descriptions, must be in ${language === 'he' ? 'Hebrew' : 'English'}.`;
            const prompt = `Create a travel plan for a trip to ${destination}. The traveler is interested in ${interests}. Provide 10 suggestions for 'places to visit', 5 suggestions for 'restaurants', and 5 suggestions for 'accommodations'. For each suggestion, include a name, a short description (around 30 words), latitude, and longitude. Also, provide a relevant URL: 'infoUrl' for places, 'websiteUrl' for restaurants, and 'bookingUrl' for accommodations. ${langInstruction}`;
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    placesToVisit: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                latitude: { type: Type.NUMBER },
                                longitude: { type: Type.NUMBER },
                                infoUrl: { type: Type.STRING }
                            },
                            required: ["name", "description", "latitude", "longitude", "infoUrl"]
                        }
                    },
                    restaurants: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                latitude: { type: Type.NUMBER },
                                longitude: { type: Type.NUMBER },
                                websiteUrl: { type: Type.STRING }
                            },
                            required: ["name", "description", "latitude", "longitude", "websiteUrl"]
                        }
                    },
                    accommodations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                latitude: { type: Type.NUMBER },
                                longitude: { type: Type.NUMBER },
                                bookingUrl: { type: Type.STRING }
                            },
                            required: ["name", "description", "latitude", "longitude", "bookingUrl"]
                        }
                    }
                },
                required: ["placesToVisit", "restaurants", "accommodations"]
            };
            
            const response = await ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            const rawPlan = JSON.parse(extractJson(response.text)) as TravelPlan;

            setLoadingMessage(t('loadingMsg2'));
            const placeNames = rawPlan.placesToVisit.slice(0, 3).map(p => p.name).join(', ');
            const imagePrompt = `A stunning, high-resolution cinematic collage of ${destination} featuring ${placeNames}. Artistic travel postcard style, vibrant colors, landmarks blended together beautifully.`;
            
            try {
                // Image generation
                const imageResponse = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-image',
                    contents: {
                        parts: [
                            { text: imagePrompt }
                        ]
                    },
                    config: {
                        imageConfig: {
                            aspectRatio: "16:9",
                        },
                    },
                });
                let base64ImageBytes = "";
                for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        base64ImageBytes = part.inlineData.data;
                        break;
                    }
                }
                if (base64ImageBytes) {
                    setCollageImageUrl(`data:image/jpeg;base64,${base64ImageBytes}`);
                } else {
                    throw new Error("No image data found in response");
                }
            } catch (imgErr) {
                console.error("Image generation failed, using fallback:", imgErr);
                setCollageImageUrl(`https://picsum.photos/seed/${encodeURIComponent(destination)}/1200/400`);
            }

            setLoadingMessage(t('loadingMsg3'));
            const enrichPlanWithImages = async (plan: TravelPlan): Promise<TravelPlan> => {
                const addImages = async (locations: Location[]) => {
                    const promises = locations.map(async (location) => {
                        const images = await getWikimediaImageUrls(location.name, destination);
                        return { ...location, images };
                    });
                    return Promise.all(promises);
                };

                const [placesWithImages, restaurantsWithImages, accommodationsWithImages] = await Promise.all([
                    addImages(plan.placesToVisit),
                    addImages(plan.restaurants),
                    addImages(plan.accommodations)
                ]);

                return {
                    placesToVisit: placesWithImages,
                    restaurants: restaurantsWithImages,
                    accommodations: accommodationsWithImages,
                };
            };

            const finalPlan = await enrichPlanWithImages(rawPlan);

            setOriginalTravelPlan(finalPlan);
            setDisplayTravelPlan(finalPlan);
            setDisplayDestination(destination);
            setGenerationLanguage(language);
            setLoading(false);
            setTimeout(() => document.getElementById('trip-visualization')?.scrollIntoView({ behavior: 'smooth' }), 100);

        } catch (err: any) {
            console.error("Error generating travel plan:", err);
            const detailMsg = err?.message ? ` (${err.message})` : '';
            setError(`${t('errorContent')}${detailMsg}`);
            setLoading(false);
        }
    };

 return (
    <>
      <LanguageSwitcher language={language} setLanguage={setLanguage} />
      <AnimatePresence>
        {isLoadModalOpen && (
          <LoadTripsModal
            savedTrips={savedTrips}
            onLoad={handleLoadTrip}
            onDelete={handleDeleteTrip}
            onClose={() => setIsLoadModalOpen(false)}
            t={t}
          />
        )}
      </AnimatePresence>
      <div className="container mx-auto p-4 sm:p-6 lg:p-12 max-w-7xl font-sans text-gray-900 overflow-x-hidden">

        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          id="trip-form-section" 
          className="text-center my-8 sm:my-16"
        >
          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-400 tracking-tighter mb-4 leading-tight">{t('title')}</h1>
          <p className="mt-4 text-lg sm:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">{t('subtitle')}</p>
          
          <form onSubmit={handleSubmit} className="mt-12 max-w-3xl mx-auto bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 transition-all duration-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative">
                <label htmlFor="destination" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ltr:text-left rtl:text-right">{t('destinationLabel')}</label>
                <div className="relative flex items-center">
                  <MapPin className="absolute ltr:left-3 rtl:right-3 text-indigo-400" size={18} />
                  <input
                    type="text"
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={t('destinationPlaceholder')}
                    required
                    className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-4 bg-gray-50/50 border-0 rounded-2xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="interests" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ltr:text-left rtl:text-right">{t('interestsLabel')}</label>
                <input
                  type="text"
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder={t('interestsPlaceholder')}
                  className="w-full px-4 py-4 bg-gray-50/50 border-0 rounded-2xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:w-auto inline-flex justify-center items-center px-10 py-4 text-lg font-bold rounded-2xl shadow-lg shadow-indigo-500/30 text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-indigo-300 disabled:scale-100 transition-all"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                {loading ? t('planningTrip') : t('generatePlan')}
              </button>
              <button 
                type="button" 
                onClick={() => setIsLoadModalOpen(true)} 
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-2xl shadow-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
              >
                <FolderOpen className="ltr:mr-2 rtl:ml-2" size={20} /> {t('loadTrips')}
              </button>
            </div>
          </form>
        </motion.header>

        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              id="loading-indicator" 
              className="text-center my-12"
            >
              <div className="inline-flex flex-col items-center bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <Loader2 className="animate-spin h-12 w-12 text-indigo-500 mb-4" />
                <span className="text-gray-900 font-bold text-xl">{loadingMessage || t('planningTrip')}</span>
                <p className="text-gray-400 text-sm mt-2">This might take a few seconds...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isTranslating && (
            <div className="fixed top-2 left-14 sm:top-4 sm:left-16 z-50 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg shadow-lg flex items-center animate-pulse">
                <svg className="animate-spin h-4 w-4 text-white ltr:mr-2 rtl:ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">{t('translatingTrip')}</span>
            </div>
         )}

        {error && (
          <div id="error-message" className="my-12 max-w-2xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow" role="alert">
            <p className="font-bold">{t('errorPrefix')}</p>
            <p>{error}</p>
          </div>
        )}

        {displayTravelPlan && (
          <motion.main 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            id="trip-visualization" 
            className="mt-16 sm:mt-24 space-y-16"
          >
             <div className="printable-content bg-white/50 backdrop-blur-sm p-6 sm:p-10 lg:p-12 rounded-[2.5rem] shadow-2xl border border-white">
                {collageImageUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="collage-container mb-16 p-3 bg-white rounded-3xl shadow-2xl overflow-hidden"
                  >
                     <img 
                       src={collageImageUrl} 
                       alt={`Artistic collage for ${destination}`} 
                       crossOrigin="anonymous"
                       referrerPolicy="no-referrer"
                       className="w-full h-[300px] sm:h-[500px] object-cover rounded-2xl" 
                     />
                  </motion.div>
                )}
                
                <div id="trip-actions" className="flex flex-col lg:flex-row justify-between items-center mb-16 gap-6">
                  <div className="text-center lg:text-left rtl:lg:text-right">
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">
                        {t('yourTripTo')} <span className="text-indigo-600 block sm:inline">{displayDestination}</span>
                    </h2>
                    <p className="text-gray-400 font-semibold uppercase tracking-widest text-sm mt-2">{interests || t('noInterests')}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                      <button onClick={handleSaveTrip} className="inline-flex items-center px-6 py-3 border border-gray-200 text-sm font-bold rounded-2xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all">
                        <Save className="ltr:mr-2 rtl:ml-2 text-indigo-500" size={18} /> {t('saveTrip')}
                      </button>
                      <button onClick={handleExportPdf} disabled={isExporting} className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-2xl shadow-lg shadow-indigo-200 text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-indigo-300 transition-all">
                        {isExporting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Download className="ltr:mr-2 rtl:ml-2" size={18} />}
                        {isExporting ? t('exportingPdf') : t('exportPdf')}
                      </button>
                      <button onClick={handlePrintTrip} type="button" className="inline-flex items-center px-6 py-3 border border-gray-200 text-sm font-bold rounded-2xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all">
                        <Printer className="ltr:mr-2 rtl:ml-2 text-indigo-500" size={18} /> {t('printTrip')}
                      </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showSaveConfirmation && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-3" 
                      role="alert"
                    >
                      <div className="bg-green-100 p-2 rounded-full"><Save size={18}/></div>
                      <span className="font-bold">{t('tripSaved')}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Places to Visit */}
                <section className="mb-20">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 p-3 rounded-2xl"><MapPin className="text-indigo-600" size={28} /></div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('placesToVisit')}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayTravelPlan.placesToVisit.map((loc, i) => <LocationCard key={`place-${i}`} location={loc} colorClass="text-indigo-600" t={t} />)}
                  </div>
                </section>

                {/* Restaurants */}
                <section className="mb-20">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-amber-100 p-3 rounded-2xl"><Utensils className="text-amber-600" size={28} /></div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('restaurants')}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayTravelPlan.restaurants.map((loc, i) => <LocationCard key={`restaurant-${i}`} location={loc} colorClass="text-amber-600" t={t} />)}
                  </div>
                </section>

                {/* Accommodations */}
                <section>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-emerald-100 p-3 rounded-2xl"><Hotel className="text-emerald-600" size={28} /></div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('accommodations')}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayTravelPlan.accommodations.map((loc, i) => <LocationCard key={`acc-${i}`} location={loc} colorClass="text-emerald-600" t={t} />)}
                  </div>
                </section>
             </div>
             
             {/* Map Overview */}
             <motion.section 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               id="map-overview" 
               className="mt-16"
             >
                  <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white">
                       <div className="flex items-center gap-3 mb-8">
                        <div className="bg-sky-100 p-3 rounded-2xl"><Globe className="text-sky-600" size={28} /></div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('mapOverview')}</h2>
                      </div>
                      <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-200">
                        <TripMap plan={displayTravelPlan} t={t}/>
                      </div>
                  </div>
             </motion.section>
          </motion.main>
        )}
      </div>
    </>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">משהו השתבש בטעינה</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred while rendering the application."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95 text-sm"
            >
              טען מחדש / Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
}
