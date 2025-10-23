// Global variables
let autocompleteSystem = null;
let selectedVehicle = 'comfort';
let currentStops = [];

// Initialize Google Maps
function initGoogleMaps() {
    console.log('Google Maps API loaded');
    
    // Initialize autocomplete system
    if (typeof NexaRideAutocomplete !== 'undefined') {
        autocompleteSystem = new NexaRideAutocomplete();
        initQuoteForm();
    } else {
        console.error('NexaRideAutocomplete not found');
    }
}

// Initialize quote form
function initQuoteForm() {
    if (!autocompleteSystem) {
        console.error('Autocomplete system not initialized');
        return;
    }

    // Setup autocomplete for pickup and destination
    autocompleteSystem.setupAutocomplete('pickupLocation', 'pickupSuggestions');
    autocompleteSystem.setupAutocomplete('destination', 'destinationSuggestions');

    // Setup vehicle options
    setupVehicleOptions();

    // Setup form submission
    const form = document.getElementById('quoteForm');
    if (form) {
        form.addEventListener('submit', handleQuoteSubmit);
    }

    // Setup date/time defaults
    setupDateTime();

    // Setup quote calculation triggers
    setupQuoteCalculation();
}

// Setup vehicle options
function setupVehicleOptions() {
    const vehicles = [
        {
            id: 'economy',
            name: 'Economy',
            icon: 'fas fa-car',
            description: '4 posti, WiFi gratuito',
            priceFrom: '€1.20/km',
            color: 'gray'
        },
        {
            id: 'comfort',
            name: 'Comfort',
            icon: 'fas fa-car',
            description: 'Aria condizionata, Acqua',
            priceFrom: '€1.50/km',
            color: 'blue'
        },
        {
            id: 'business',
            name: 'Business',
            icon: 'fas fa-car',
            description: 'Servizio premium',
            priceFrom: '€2.00/km',
            color: 'indigo'
        },
        {
            id: 'luxury',
            name: 'Luxury',
            icon: 'fas fa-car',
            description: 'Veicoli di lusso, VIP',
            priceFrom: '€3.00/km',
            color: 'yellow'
        }
    ];

    const container = document.getElementById('vehicleOptions');
    if (!container) return;

    container.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-option border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${selectedVehicle === vehicle.id ? `border-${vehicle.color}-600 bg-${vehicle.color}-50` : 'border-gray-200'}"
             onclick="selectVehicle('${vehicle.id}')">
            <div class="text-center">
                <i class="${vehicle.icon} text-2xl ${selectedVehicle === vehicle.id ? `text-${vehicle.color}-600` : 'text-gray-600'} mb-2"></i>
                <h4 class="font-semibold text-gray-800">${vehicle.name}</h4>
                <p class="text-sm text-gray-600 mb-2">${vehicle.description}</p>
                <p class="text-sm font-semibold text-${vehicle.color}-600">${vehicle.priceFrom}</p>
            </div>
        </div>
    `).join('');
}

// Select vehicle
function selectVehicle(vehicleId) {
    selectedVehicle = vehicleId;
    setupVehicleOptions(); // Re-render to update selection
    calculateQuote(); // Recalculate quote with new vehicle
}

// Setup date and time defaults
function setupDateTime() {
    const dateInput = document.getElementById('tripDate');
    const timeInput = document.getElementById('tripTime');
    
    if (dateInput) {
        // Set minimum date to today
        const today = new Date();
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.value = today.toISOString().split('T')[0];
    }
    
    if (timeInput) {
        // Set default time to current time + 1 hour
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const timeString = now.toTimeString().slice(0, 5);
        timeInput.value = timeString;
    }
}

// Setup quote calculation triggers
function setupQuoteCalculation() {
    const triggers = ['pickupLocation', 'destination'];
    
    triggers.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(calculateQuote, 1000));
            element.addEventListener('change', calculateQuote);
        }
    });
}

// Calculate quote
function calculateQuote() {
    const pickup = document.getElementById('pickupLocation')?.value;
    const destination = document.getElementById('destination')?.value;
    
    if (!pickup || !destination || pickup.length < 3 || destination.length < 3) {
        hideQuoteDisplay();
        return;
    }
    
    if (autocompleteSystem) {
        autocompleteSystem.calculateRoute(pickup, destination, currentStops, selectedVehicle);
    }
}

// Show quote display
function showQuoteDisplay(data) {
    const display = document.getElementById('quoteDisplay');
    const price = document.getElementById('quotePrice');
    const duration = document.getElementById('quoteDuration');
    const details = document.getElementById('quoteDetails');
    
    if (display && price && duration && details) {
        display.classList.remove('hidden');
        price.textContent = `€${data.price}`;
        duration.textContent = `${data.duration} min`;
        details.textContent = `${data.distance} km • ${data.vehicle} • ${currentStops.length} fermate`;
    }
}

// Hide quote display
function hideQuoteDisplay() {
    const display = document.getElementById('quoteDisplay');
    if (display) {
        display.classList.add('hidden');
    }
}

// Add stop
function addStop() {
    const container = document.getElementById('stopsContainer');
    if (!container) return;
    
    const stopIndex = currentStops.length;
    const stopId = `stop_${stopIndex}`;
    
    const stopHTML = `
        <div class="stop-item" data-stop-index="${stopIndex}">
            <div class="flex items-center space-x-2">
                <div class="flex-1 relative">
                    <input type="text" 
                           id="${stopId}" 
                           name="stops[]"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Fermata intermedia ${stopIndex + 1}"
                           data-stop-index="${stopIndex}">
                    <div id="${stopId}Suggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden max-h-60 overflow-y-auto shadow-lg"></div>
                </div>
                <button type="button" 
                        onclick="removeStop(${stopIndex})" 
                        class="text-red-600 hover:text-red-700 p-2">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', stopHTML);
    currentStops.push('');
    
    // Setup autocomplete for new stop
    if (autocompleteSystem) {
        autocompleteSystem.setupAutocomplete(stopId, `${stopId}Suggestions`);
    }
    
    // Add event listener for stop changes
    const stopInput = document.getElementById(stopId);
    if (stopInput) {
        stopInput.addEventListener('input', (e) => {
            currentStops[stopIndex] = e.target.value;
            debounce(calculateQuote, 1000)();
        });
    }
}

// Remove stop
function removeStop(index) {
    const stopItem = document.querySelector(`[data-stop-index="${index}"]`);
    if (stopItem) {
        stopItem.remove();
        currentStops.splice(index, 1);
        
        // Update remaining stop indices
        updateStopIndices();
        calculateQuote();
    }
}

// Update stop indices after removal
function updateStopIndices() {
    const stopItems = document.querySelectorAll('.stop-item');
    stopItems.forEach((item, newIndex) => {
        const input = item.querySelector('input[name="stops[]"]');
        const suggestions = item.querySelector('[id$="Suggestions"]');
        
        if (input && suggestions) {
            const newStopId = `stop_${newIndex}`;
            input.id = newStopId;
            input.placeholder = `Fermata intermedia ${newIndex + 1}`;
            input.setAttribute('data-stop-index', newIndex);
            suggestions.id = `${newStopId}Suggestions`;
            item.setAttribute('data-stop-index', newIndex);
            
            // Update remove button
            const removeBtn = item.querySelector('button[onclick*="removeStop"]');
            if (removeBtn) {
                removeBtn.setAttribute('onclick', `removeStop(${newIndex})`);
            }
        }
    });
}

// Add stop from homepage buttons
function addStopFromHomepage(destination) {
    // Scroll to quote form
    const form = document.getElementById('quoteForm');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
        
        // Focus on destination field after scroll
        setTimeout(() => {
            const destinationInput = document.getElementById('destination');
            if (destinationInput) {
                destinationInput.focus();
                destinationInput.value = destination;
                destinationInput.dispatchEvent(new Event('input'));
            }
        }, 1000);
    }
}

// Handle quote form submission
function handleQuoteSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        pickup: formData.get('pickupLocation'),
        destination: formData.get('destination'),
        stops: currentStops.filter(stop => stop.trim() !== ''),
        date: formData.get('tripDate'),
        time: formData.get('tripTime'),
        vehicle: selectedVehicle
    };
    
    // Validate required fields
    if (!data.pickup || !data.destination || !data.date || !data.time) {
        alert('Per favore compila tutti i campi obbligatori');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Invio in corso...';
    submitBtn.disabled = true;
    
    // Send booking request
    fetch('/api/booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert(`Prenotazione completata!\nCodice: ${result.bookingId}\n\n${result.message}`);
            e.target.reset();
            setupDateTime(); // Reset date/time
            currentStops = [];
            document.getElementById('stopsContainer').innerHTML = '';
            hideQuoteDisplay();
        } else {
            alert('Errore durante la prenotazione: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Booking error:', error);
        alert('Errore durante la prenotazione. Riprova più tardi.');
    })
    .finally(() => {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// Mobile menu toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Login modal functions
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
        // Reset form
        document.getElementById('loginForm').reset();
    }
}

// Login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };
            
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(`Benvenuto, ${result.user.name}!\nRuolo: ${result.user.role}`);
                    closeLoginModal();
                    // Here you could redirect to admin panel or update UI
                } else {
                    alert('Login fallito: ' + result.message);
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                alert('Errore durante il login');
            });
        });
    }
});

// Utility functions
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

// Close mobile menu when clicking on links
document.addEventListener('DOMContentLoaded', function() {
    const mobileLinks = document.querySelectorAll('#mobileMenu a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            const menu = document.getElementById('mobileMenu');
            if (menu) {
                menu.classList.add('hidden');
            }
        });
    });
});

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
