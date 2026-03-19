let map;
let marker;

const quantityInput = document.getElementById('quantity');
const totalAmountDisplay = document.getElementById('totalAmount');
const btnMinus = document.getElementById('btnMinus');
const btnPlus = document.getElementById('btnPlus');
const PRICE_PER_CAN = 60;

// Quantity Selector Logic
function updatePrice() {
    const qty = parseInt(quantityInput.value) || 0;
    totalAmountDisplay.textContent = qty * PRICE_PER_CAN;
}

btnPlus.addEventListener('click', () => {
    quantityInput.value = parseInt(quantityInput.value) + 1;
    updatePrice();
});

btnMinus.addEventListener('click', () => {
    if (parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
        updatePrice();
    }
});

// Business Configuration
const BUSINESS_LOCATION = [13.2438, 77.7095]; // Devanahalli (Next to Dmart, opposite Bharat Petroleum)
const MAX_RADIUS_KM = 10;


// Helper: Calculate distance between two points (Km)
function getDistance(p1, p2) {
    const R = 6371; // Earth's radius in km
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Map Initialization (Leaflet)
function initMap() {
    // Define Base Layers
    const streetView = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    const satelliteView = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
    });

    map = L.map('map', {
        center: BUSINESS_LOCATION,
        zoom: 12,
        layers: [streetView] // Default layer
    });

    const baseMaps = {
        "Street View": streetView,
        "Satellite View": satelliteView
    };

    // Add Layer Control
    L.control.layers(baseMaps).addTo(map);


    // Draw 10km Service Radius Circle
    const circle = L.circle(BUSINESS_LOCATION, {
        color: 'var(--accent-cyan)',
        fillColor: 'var(--accent-cyan)',
        fillOpacity: 0.1,
        radius: MAX_RADIUS_KM * 1000 // meters
    }).addTo(map);

    marker = L.marker(BUSINESS_LOCATION, { draggable: true }).addTo(map);

    function validatePosition(latlng) {
        const dist = getDistance(BUSINESS_LOCATION, [latlng.lat, latlng.lng]);
            alert(`The location is too far! We only deliver within a ${MAX_RADIUS_KM}km radius of our Devanahalli center (Nisarga Sri Vinayaka Minerals).`);
        return true;
    }


    // Handle marker drag
    marker.on('dragend', (e) => {
        if (!validatePosition(e.target.getLatLng())) {
            marker.setLatLng(BUSINESS_LOCATION); // Snap back
            map.setView(BUSINESS_LOCATION, 12);
        }
    });

    // Click on map to move marker
    map.on('click', (e) => {
        if (validatePosition(e.latlng)) {
            marker.setLatLng(e.latlng);
        }
    });
}

// Photon Search Logic (Detect location as you type)
const searchInput = document.getElementById('autocomplete');
const searchResults = document.getElementById('searchResults');
let searchTimeout;

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value;

    if (query.length < 3) {
        searchResults.style.display = 'none';
        return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
        fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`)
            .then(res => res.json())
            .then(data => {
                displayResults(data.features);
            });
    }, 400);
});

function displayResults(features) {
    if (!features || features.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    searchResults.innerHTML = '';
    features.forEach(feature => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.style.padding = '12px 16px';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        const props = feature.properties;
        const name = props.name || '';
        const city = props.city || '';
        const country = props.country || '';
        div.textContent = `${name}${city ? ', ' + city : ''}${country ? ', ' + country : ''}`;

        div.onclick = () => {
            const [lng, lat] = feature.geometry.coordinates;
            const dist = getDistance(BUSINESS_LOCATION, [lat, lng]);
            
            if (dist > MAX_RADIUS_KM) {
                alert("The location is too far from our service area!");
                return;
            }


            map.setView([lat, lng], 16);
            marker.setLatLng([lat, lng]);
            searchInput.value = div.textContent;
            searchResults.style.display = 'none';
        };

        div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.05)';
        div.onmouseout = () => div.style.background = 'transparent';

        searchResults.appendChild(div);
    });

    searchResults.style.display = 'block';
}

// Close search if clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Initialize everything
window.onload = initMap;

// Form Submission
document.getElementById('orderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const pos = marker.getLatLng();
    const qty = quantityInput.value;
    const address = searchInput.value;
    
    // Final Radius Check
    const dist = getDistance(BUSINESS_LOCATION, [pos.lat, pos.lng]);
    if (dist > MAX_RADIUS_KM) {
        alert(`Final Check: Delivery location is ${dist.toFixed(1)}km away, which exceeds our ${MAX_RADIUS_KM}km limit.`);
        return;
    }

    if(!address) {
        alert("Please enter a delivery address.");
        return;
    }

    alert(`Order Placed Successfully!\n\nBranding: Nisarga Sri Vinayaka Minerals\nQuantity: ${qty} cans\nTotal: ₹${qty * PRICE_PER_CAN}\nAddress: ${address}\nCoords: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
});

