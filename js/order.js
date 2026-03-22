let map;
let marker;
const PRICE_PER_CAN = 60;

const BUSINESS_LOCATION = [13.2438, 77.7095];
const MAX_RADIUS_KM = 7;

function getDistance(p1, p2) {
    const R = 6371;
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function initMap() {
    const streetView = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    const satelliteView = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });

    map = L.map('map', {
        center: BUSINESS_LOCATION,
        zoom: 12,
        layers: [streetView]
    });

    const baseMaps = {
        "Street View": streetView,
        "Satellite View": satelliteView
    };

    L.control.layers(baseMaps).addTo(map);

    L.circle(BUSINESS_LOCATION, {
        color: '#00d4ff',
        fillColor: '#00d4ff',
        fillOpacity: 0.1,
        radius: MAX_RADIUS_KM * 1000
    }).addTo(map);

    marker = L.marker(BUSINESS_LOCATION, { draggable: true }).addTo(map);

    function validatePosition(latlng) {
        const dist = getDistance(BUSINESS_LOCATION, [latlng.lat, latlng.lng]);
        if (dist > MAX_RADIUS_KM) {
            alert(`This location is too far! We only deliver within a ${MAX_RADIUS_KM}km radius.\n\nYour distance: ${dist.toFixed(1)}km`);
            return false;
        }
        return true;
    }

    function reverseGeocode(lat, lng) {
        fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`)
            .then(res => res.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    const props = data.features[0].properties;
                    const name = props.name || '';
                    const city = props.city || '';
                    const district = props.district || '';
                    const addressParts = [name, district, city].filter(Boolean);
                    const searchInput = document.getElementById('autocomplete');
                    if (searchInput) {
                        searchInput.value = addressParts.join(', ');
                    }
                }
            })
            .catch(err => console.error('Reverse Geocode error:', err));
    }

    marker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        if (!validatePosition(position)) {
            marker.setLatLng(BUSINESS_LOCATION);
            map.setView(BUSINESS_LOCATION, 12);
        } else {
            reverseGeocode(position.lat, position.lng);
        }
    });

    map.on('click', (e) => {
        if (validatePosition(e.latlng)) {
            marker.setLatLng(e.latlng);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
        }
    });
}

function displayResults(features) {
    const searchResults = document.getElementById('searchResults');
    if (!features || features.length === 0 || !searchResults) {
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

            if (map) map.setView([lat, lng], 16);
            if (marker) marker.setLatLng([lat, lng]);
            
            const searchInput = document.getElementById('autocomplete');
            if (searchInput) searchInput.value = div.textContent;
            searchResults.style.display = 'none';
        };

        div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.05)';
        div.onmouseout = () => div.style.background = 'transparent';

        searchResults.appendChild(div);
    });

    searchResults.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const quantityInput = document.getElementById('quantity');
    const totalAmountDisplay = document.getElementById('totalAmount');
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');
    const searchInput = document.getElementById('autocomplete');
    const searchResults = document.getElementById('searchResults');
    const orderForm = document.getElementById('orderForm');

    if (quantityInput && totalAmountDisplay && btnMinus && btnPlus) {
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

        updatePrice();
    }

    if (searchInput && searchResults) {
        let searchTimeout;

        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value;

            if (query.length < 3) {
                searchResults.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(() => {
                fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`)
                    .then(res => res.json())
                    .then(data => {
                        displayResults(data.features);
                    })
                    .catch(err => console.error('Search error:', err));
            }, 400);
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!marker) {
                alert("Please select a location on the map.");
                return;
            }

            const pos = marker.getLatLng();
            const qty = quantityInput ? quantityInput.value : 1;
            const address = searchInput ? searchInput.value : '';
            
            const dist = getDistance(BUSINESS_LOCATION, [pos.lat, pos.lng]);
            if (dist > MAX_RADIUS_KM) {
                alert(`Delivery location is ${dist.toFixed(1)}km away, exceeds our ${MAX_RADIUS_KM}km limit.`);
                return;
            }

            if (!address) {
                alert("Please enter a delivery address.");
                return;
            }

            const orderData = {
                id: `NS-${Math.floor(1000 + Math.random() * 9000)}`,
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                qty: qty,
                total: qty * PRICE_PER_CAN,
                status: 'Delivered'
            };

            const existingOrders = JSON.parse(localStorage.getItem('nisarga_orders') || '[]');
            existingOrders.unshift(orderData);
            localStorage.setItem('nisarga_orders', JSON.stringify(existingOrders));

            const userProfile = JSON.parse(localStorage.getItem('nisarga_user_profile') || '{}');
            const userName = userProfile.username || 'Guest';
            const userPhone = userProfile.phone || 'Not provided';
            
            const ownerPhone = "8792678849";
            const waMessage = `*New Order - Nisarga*%0A%0A*Name:* ${userName}%0A*Phone:* ${userPhone}%0A*Quantity:* ${qty} Cans%0A*Total:* ₹${orderData.total}%0A*Address:* ${address}%0A*Order ID:* ${orderData.id}`;

            const waURL = `https://wa.me/91${ownerPhone}?text=${waMessage}`;

            alert(`Order Placed!\n\nOrder ID: ${orderData.id}\n\nRedirecting to WhatsApp to confirm.`);
            window.open(waURL, '_blank');
            window.location.href = 'profile.html';
        });
    }

    if (typeof L !== 'undefined') {
        initMap();
    }
});
