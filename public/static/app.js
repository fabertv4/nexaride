// Global variables
let autocomplete;
let currentQuoteData = null;
let stopCounter = 0;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing app...');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
    }
    
    // Set default time to current time + 1 hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const timeInput = document.getElementById('time');
    if (timeInput) {
        timeInput.value = now.toTimeString().slice(0, 5);
    }
    
    // Initialize quote form
    initQuoteForm();
    
    // Initialize login form
    initLoginForm();
});

// Initialize Google Maps (called by Google Maps API)
function initGoogleMaps() {
    console.log('Google Maps API loaded - initializing autocomplete...');
    
    if (typeof NexaRideAutocomplete !== 'undefined') {
        autocomplete = new NexaRideAutocomplete();
        autocomplete.init();
        console.log('Autocomplete system initialized');
    } else {
        console.error('NexaRideAutocomplete not found');
    }
}

// Initialize quote form
function initQuoteForm() {
    const form = document.getElementById('quoteForm');
    if (!form) return;
    
    form.addEventListener('submit', handleQuoteSubmit);
    
    // Add input listeners for real-time quote updates
    const inputs = ['pickup', 'destination', 'passengers'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', debounce(updateQuotePreview, 500));
        }
    });
}

// Handle quote form submission
async function handleQuoteSubmit(event) {
    event.preventDefault();
    console.log('Quote form submitted');
    
    const formData = new FormData(event.target);
    const quoteData = {
        tripType: document.querySelector('.trip-type-btn.active')?.id === 'roundTripBtn' ? 'round-trip' : 'one-way',
        pickup: formData.get('pickup'),
        destination: formData.get('destination'),
        date: formData.get('date'),
        time: formData.get('time'),
        passengers: formData.get('passengers'),
        stops: []
    };
    
    // Collect stops
    document.querySelectorAll('[id^="stop"]').forEach(stopInput => {
        if (stopInput.value.trim()) {
            quoteData.stops.push(stopInput.value.trim());
        }
    });
    
    // Validate required fields
    if (!quoteData.pickup || !quoteData.destination) {
        alert('Inserisci almeno il luogo di ritiro e la destinazione');
        return;
    }
    
    try {
        showLoading(true);
        
        // Calculate route and get quote
        let finalQuote = null;
        
        if (autocomplete) {
            finalQuote = await autocomplete.calculateFullQuote(quoteData);
        }
        
        // Fallback to server quote if autocomplete fails
        if (!finalQuote) {
            const response = await axios.post('/api/quote', quoteData);
            if (response.data.success) {
                finalQuote = response.data.quote;
            }
        }
        
        if (finalQuote) {
            currentQuoteData = { ...quoteData, quote: finalQuote };
            showVehicleSelection(finalQuote);
        } else {
            throw new Error('Impossibile calcolare il preventivo');
        }
        
    } catch (error) {
        console.error('Quote submission error:', error);
        alert('Errore nel calcolo del preventivo. Riprova più tardi.');
    } finally {
        showLoading(false);
    }
}

// Update quote preview in real-time
async function updateQuotePreview() {
    const pickup = document.getElementById('pickup')?.value;
    const destination = document.getElementById('destination')?.value;
    const passengers = document.getElementById('passengers')?.value;
    
    if (!pickup || !destination) {
        hideQuoteDisplay();
        return;
    }
    
    try {
        let estimatedPrice = null;
        let details = 'Preventivo approssimativo';
        
        // Try to get real-time quote from autocomplete
        if (autocomplete) {
            const result = await autocomplete.getQuickQuote(pickup, destination, passengers);
            if (result) {
                estimatedPrice = result.price;
                details = result.details;
            }
        }
        
        // Fallback calculation
        if (!estimatedPrice) {
            const basePrice = passengers <= 3 ? 35 : passengers <= 6 ? 55 : 75;
            estimatedPrice = Math.round(basePrice * (1.2 + Math.random() * 0.3));
            details = 'Stima basata sulla distanza';
        }
        
        showQuoteDisplay(estimatedPrice, details);
        
    } catch (error) {
        console.error('Preview update error:', error);
    }
}

// Show quote display
function showQuoteDisplay(price, details) {
    const quoteDisplay = document.getElementById('quoteDisplay');
    const quoteAmount = document.getElementById('quoteAmount');
    const quoteDetails = document.getElementById('quoteDetails');
    
    if (quoteDisplay && quoteAmount && quoteDetails) {
        quoteAmount.textContent = `€${price}`;
        quoteDetails.textContent = details;
        quoteDisplay.classList.remove('hidden');
    }
}

// Hide quote display
function hideQuoteDisplay() {
    const quoteDisplay = document.getElementById('quoteDisplay');
    if (quoteDisplay) {
        quoteDisplay.classList.add('hidden');
    }
}

// Show vehicle selection modal
function showVehicleSelection(quote) {
    const modal = document.getElementById('vehicleModal');
    const vehicleOptions = document.getElementById('vehicleOptions');
    
    if (!modal || !vehicleOptions || !quote.vehicles) return;
    
    vehicleOptions.innerHTML = quote.vehicles.map(vehicle => `
        <div class="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary transition cursor-pointer vehicle-option" 
             onclick="selectVehicle('${vehicle.type}', ${vehicle.price})">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="text-xl font-bold text-gray-800">${vehicle.type}</h4>
                    <p class="text-gray-600">${vehicle.capacity}</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-primary">€${vehicle.price}</div>
                    <div class="text-sm text-gray-500">prezzo finale</div>
                </div>
            </div>
            <ul class="text-sm text-gray-600 space-y-1">
                ${vehicle.features.map(feature => `
                    <li><i class="fas fa-check text-green-500 mr-2"></i>${feature}</li>
                `).join('')}
            </ul>
            <button class="w-full mt-4 bg-primary text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
                Seleziona ${vehicle.type}
            </button>
        </div>
    `).join('');
    
    modal.classList.remove('hidden');
}

// Select vehicle and proceed
function selectVehicle(vehicleType, price) {
    console.log(`Vehicle selected: ${vehicleType} - €${price}`);
    
    alert(`Hai selezionato ${vehicleType} per €${price}.\n\nIn un sistema completo, qui procederesti con:\n• Inserimento dati passeggero\n• Metodo di pagamento\n• Conferma prenotazione`);
    
    closeVehicleModal();
}

// Close vehicle selection modal
function closeVehicleModal() {
    const modal = document.getElementById('vehicleModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Trip type selection
function setTripType(type) {
    const oneWayBtn = document.getElementById('oneWayBtn');
    const roundTripBtn = document.getElementById('roundTripBtn');
    
    if (oneWayBtn && roundTripBtn) {
        oneWayBtn.classList.remove('active');
        roundTripBtn.classList.remove('active');
        
        if (type === 'one-way') {
            oneWayBtn.classList.add('active');
        } else {
            roundTripBtn.classList.add('active');
        }
    }
}

// Add stop functionality
function addStop() {
    stopCounter++;
    const stopsContainer = document.getElementById('stopsContainer');
    
    if (!stopsContainer) return;
    
    const stopDiv = document.createElement('div');
    stopDiv.className = 'space-y-2';
    stopDiv.id = `stopContainer${stopCounter}`;
    
    stopDiv.innerHTML = `
        <label class="block text-sm font-semibold text-gray-700">
            <i class="fas fa-map-marker-alt text-yellow-500 mr-2"></i>Tappa ${stopCounter}
        </label>
        <div class="relative">
            <input type="text" id="stop${stopCounter}" name="stop${stopCounter}"
                   class="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                   placeholder="Inserisci tappa intermedia">
            <button type="button" onclick="removeStop(${stopCounter})" 
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition">
                <i class="fas fa-times"></i>
            </button>
            <div id="stop${stopCounter}Suggestions" class="autocomplete-suggestions"></div>
        </div>
    `;
    
    stopsContainer.appendChild(stopDiv);
    
    // Initialize autocomplete for the new stop if available
    if (autocomplete) {
        setTimeout(() => {
            const stopInput = document.getElementById(`stop${stopCounter}`);
            if (stopInput) {
                autocomplete.initInput(stopInput, `stop${stopCounter}Suggestions`);
            }
        }, 100);
    }
}

// Remove stop functionality
function removeStop(stopId) {
    const stopContainer = document.getElementById(`stopContainer${stopId}`);
    if (stopContainer) {
        stopContainer.remove();
    }
}

// Add stop from homepage (if needed for other integrations)
function addStopFromHomepage() {
    addStop();
}

// Login functionality
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!username || !password) {
        alert('Inserisci username e password');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await axios.post('/api/login', { username, password });
        
        if (response.data.success) {
            alert(`${response.data.message}\n\nIn un sistema completo saresti reindirizzato alla dashboard ${response.data.user.role}.`);
            closeLoginModal();
        } else {
            alert(response.data.message || 'Errore nel login');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Errore di connessione. Riprova più tardi.');
    } finally {
        showLoading(false);
    }
}

// Modal functions
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Focus on username field
        setTimeout(() => {
            const usernameField = document.getElementById('username');
            if (usernameField) usernameField.focus();
        }, 100);
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
        // Reset form
        const form = document.getElementById('loginForm');
        if (form) form.reset();
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// Loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Style updates for trip type buttons
document.addEventListener('DOMContentLoaded', function() {
    // Add styles for trip type buttons
    const style = document.createElement('style');
    style.textContent = `
        .trip-type-btn {
            background: white;
            border-color: #e5e7eb;
            color: #6b7280;
        }
        .trip-type-btn.active {
            background: #1e40af;
            border-color: #1e40af;
            color: white;
        }
        .trip-type-btn:hover:not(.active) {
            border-color: #1e40af;
            color: #1e40af;
        }
    `;
    document.head.appendChild(style);
});
