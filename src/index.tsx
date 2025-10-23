import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  GOOGLE_MAPS_API_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Funzione per generare l'HTML principale con Google Maps API Key dinamica
function getMainHTML(googleMapsApiKey: string = 'YOUR_GOOGLE_MAPS_API_KEY') {
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexaRide - Servizio NCC Premium</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'nexa-blue': '#1e40af',
                        'nexa-gold': '#f59e0b',
                        'nexa-dark': '#1f2937',
                        'nexa-gray': '#6b7280'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center space-x-4">
                    <div class="bg-nexa-blue text-white p-2 rounded-lg">
                        <i class="fas fa-car text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-nexa-dark">NexaRide</h1>
                        <p class="text-sm text-nexa-gray">Servizio NCC Premium</p>
                    </div>
                </div>
                <nav class="hidden md:flex space-x-8">
                    <a href="#servizi" class="text-nexa-dark hover:text-nexa-blue transition-colors">Servizi</a>
                    <a href="#flotta" class="text-nexa-dark hover:text-nexa-blue transition-colors">Flotta</a>
                    <a href="#contatti" class="text-nexa-dark hover:text-nexa-blue transition-colors">Contatti</a>
                    <a href="/admin" class="bg-nexa-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Area Riservata</a>
                </nav>
                <button class="md:hidden bg-nexa-blue text-white p-2 rounded-lg">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-nexa-blue to-blue-700 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 class="text-4xl md:text-5xl font-bold mb-6">
                        Servizio NCC <span class="text-nexa-gold">Premium</span>
                    </h2>
                    <p class="text-xl mb-8 opacity-90">
                        Trasferimenti aeroportuali, viaggi d'affari e servizi personalizzati con la massima professionalità e comfort.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button onclick="scrollToQuote()" class="bg-nexa-gold text-nexa-dark px-8 py-4 rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center justify-center">
                            <i class="fas fa-calculator mr-2"></i>
                            Richiedi Preventivo
                        </button>
                        <a href="tel:+393123456789" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-nexa-blue transition-colors flex items-center justify-center">
                            <i class="fas fa-phone mr-2"></i>
                            Chiama Ora
                        </a>
                    </div>
                </div>
                <div class="hidden lg:block">
                    <div class="relative">
                        <img src="https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Luxury Car" class="rounded-lg shadow-2xl">
                        <div class="absolute -bottom-6 -left-6 bg-white text-nexa-dark p-6 rounded-lg shadow-lg">
                            <div class="text-2xl font-bold text-nexa-blue">24/7</div>
                            <div class="text-sm">Disponibili sempre</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="servizi" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-nexa-dark mb-4">I Nostri Servizi</h2>
                <p class="text-xl text-nexa-gray max-w-2xl mx-auto">Soluzioni di trasporto premium per ogni esigenza</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow">
                    <div class="bg-nexa-blue text-white w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <i class="fas fa-plane text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-nexa-dark mb-4 text-center">Trasferimenti Aeroportuali</h3>
                    <p class="text-nexa-gray text-center mb-6">Servizio puntuale e affidabile da/per tutti gli aeroporti. Monitoraggio voli incluso.</p>
                    <ul class="space-y-2 text-sm text-nexa-gray">
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Monitoraggio voli in tempo reale</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Meet & Greet all'arrivo</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Assistenza bagagli</li>
                    </ul>
                </div>

                <div class="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow">
                    <div class="bg-nexa-gold text-white w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <i class="fas fa-briefcase text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-nexa-dark mb-4 text-center">Viaggi d'Affari</h3>
                    <p class="text-nexa-gray text-center mb-6">Trasporti per meeting, congressi e eventi aziendali con la massima professionalità.</p>
                    <ul class="space-y-2 text-sm text-nexa-gray">
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Servizio disponibile 24/7</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Fatturazione aziendale</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Autisti multilingue</li>
                    </ul>
                </div>

                <div class="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow">
                    <div class="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <i class="fas fa-route text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-nexa-dark mb-4 text-center">Servizi Personalizzati</h3>
                    <p class="text-nexa-gray text-center mb-6">Tours, eventi speciali e trasporti su misura per ogni occasione.</p>
                    <ul class="space-y-2 text-sm text-nexa-gray">
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Itinerari personalizzati</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Servizi turistici</li>
                        <li><i class="fas fa-check text-green-500 mr-2"></i>Eventi speciali</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Quote Section -->
    <section id="preventivo" class="py-20 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h2 class="text-3xl md:text-4xl font-bold text-nexa-dark mb-4">Richiedi un Preventivo</h2>
                <p class="text-xl text-nexa-gray">Calcola il costo del tuo viaggio in pochi secondi</p>
            </div>

            <div class="bg-white rounded-2xl shadow-xl p-8">
                <form id="quoteForm" class="space-y-6">
                    <!-- Pickup Location -->
                    <div>
                        <label class="block text-sm font-medium text-nexa-dark mb-2">
                            <i class="fas fa-map-marker-alt text-green-500 mr-2"></i>
                            Luogo di Partenza
                        </label>
                        <div class="relative">
                            <input type="text" id="pickup" name="pickup" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexa-blue focus:border-nexa-blue"
                                   placeholder="Inserisci indirizzo di partenza..."
                                   autocomplete="off">
                            <div id="pickup-suggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden shadow-lg max-h-60 overflow-y-auto"></div>
                        </div>
                    </div>

                    <!-- Stops -->
                    <div id="stops-container">
                        <!-- Dynamic stops will be added here -->
                    </div>

                    <!-- Add Stop Button -->
                    <button type="button" onclick="addStop()" 
                            class="text-nexa-blue hover:text-blue-700 font-medium flex items-center">
                        <i class="fas fa-plus mr-2"></i>
                        Aggiungi tappa intermedia
                    </button>

                    <!-- Destination -->
                    <div>
                        <label class="block text-sm font-medium text-nexa-dark mb-2">
                            <i class="fas fa-flag-checkered text-red-500 mr-2"></i>
                            Destinazione
                        </label>
                        <div class="relative">
                            <input type="text" id="destination" name="destination"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexa-blue focus:border-nexa-blue"
                                   placeholder="Inserisci destinazione..."
                                   autocomplete="off">
                            <div id="destination-suggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden shadow-lg max-h-60 overflow-y-auto"></div>
                        </div>
                    </div>

                    <!-- Date and Time -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-nexa-dark mb-2">
                                <i class="fas fa-calendar text-nexa-blue mr-2"></i>
                                Data
                            </label>
                            <input type="date" id="date" name="date" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexa-blue focus:border-nexa-blue"
                                   min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-nexa-dark mb-2">
                                <i class="fas fa-clock text-nexa-blue mr-2"></i>
                                Orario
                            </label>
                            <input type="time" id="time" name="time"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexa-blue focus:border-nexa-blue">
                        </div>
                    </div>

                    <!-- Passengers -->
                    <div>
                        <label class="block text-sm font-medium text-nexa-dark mb-2">
                            <i class="fas fa-users text-nexa-blue mr-2"></i>
                            Numero Passeggeri
                        </label>
                        <select id="passengers" name="passengers"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexa-blue focus:border-nexa-blue">
                            <option value="1">1 passeggero</option>
                            <option value="2">2 passeggeri</option>
                            <option value="3">3 passeggeri</option>
                            <option value="4">4 passeggeri</option>
                            <option value="5">5-6 passeggeri</option>
                            <option value="7">7+ passeggeri</option>
                        </select>
                    </div>

                    <!-- Vehicle Selection -->
                    <div id="vehicle-selection" class="hidden">
                        <label class="block text-sm font-medium text-nexa-dark mb-4">
                            <i class="fas fa-car text-nexa-blue mr-2"></i>
                            Seleziona Veicolo
                        </label>
                        <div id="vehicle-options" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <!-- Vehicle options will be populated dynamically -->
                        </div>
                    </div>

                    <!-- Quote Result -->
                    <div id="quote-result" class="hidden bg-nexa-blue text-white p-6 rounded-lg">
                        <h3 class="text-xl font-bold mb-2">Preventivo Calcolato</h3>
                        <div id="quote-details" class="space-y-2">
                            <!-- Quote details will be populated dynamically -->
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" 
                            class="w-full bg-nexa-gold text-nexa-dark py-4 rounded-lg font-bold text-lg hover:bg-yellow-500 transition-colors flex items-center justify-center">
                        <i class="fas fa-calculator mr-2"></i>
                        <span id="quote-button-text">Calcola Preventivo</span>
                    </button>
                </form>
            </div>
        </div>
    </section>

    <!-- Fleet Section -->
    <section id="flotta" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-nexa-dark mb-4">La Nostra Flotta</h2>
                <p class="text-xl text-nexa-gray">Veicoli di lusso per ogni occasione</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <img src="https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Berlina Executive" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-nexa-dark mb-2">Berlina Executive</h3>
                        <p class="text-nexa-gray mb-4">Mercedes Classe E, BMW Serie 5 o similari</p>
                        <ul class="space-y-2 text-sm text-nexa-gray">
                            <li><i class="fas fa-user text-nexa-blue mr-2"></i>1-3 passeggeri</li>
                            <li><i class="fas fa-suitcase text-nexa-blue mr-2"></i>2-3 bagagli</li>
                            <li><i class="fas fa-wifi text-nexa-blue mr-2"></i>WiFi incluso</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <img src="https://images.unsplash.com/photo-1544829099-b9a0c5303bea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="SUV Premium" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-nexa-dark mb-2">SUV Premium</h3>
                        <p class="text-nexa-gray mb-4">Mercedes GLE, BMW X5 o similari</p>
                        <ul class="space-y-2 text-sm text-nexa-gray">
                            <li><i class="fas fa-users text-nexa-blue mr-2"></i>1-6 passeggeri</li>
                            <li><i class="fas fa-suitcase text-nexa-blue mr-2"></i>4-6 bagagli</li>
                            <li><i class="fas fa-snowflake text-nexa-blue mr-2"></i>Clima duale</li>
                        </ul>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Minivan Luxury" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-nexa-dark mb-2">Minivan Luxury</h3>
                        <p class="text-nexa-gray mb-4">Mercedes Vito, Volkswagen Multivan o similari</p>
                        <ul class="space-y-2 text-sm text-nexa-gray">
                            <li><i class="fas fa-users text-nexa-blue mr-2"></i>6-8 passeggeri</li>
                            <li><i class="fas fa-suitcase text-nexa-blue mr-2"></i>8+ bagagli</li>
                            <li><i class="fas fa-charging-station text-nexa-blue mr-2"></i>Prese USB</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contatti" class="py-20 bg-nexa-dark text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4">Contattaci</h2>
                <p class="text-xl opacity-90">Siamo sempre a tua disposizione</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="text-center">
                    <div class="bg-nexa-blue w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <i class="fas fa-phone text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Telefono</h3>
                    <p class="opacity-90">+39 312 345 6789</p>
                    <p class="opacity-90">Disponibile 24/7</p>
                </div>
                
                <div class="text-center">
                    <div class="bg-nexa-gold w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <i class="fas fa-envelope text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Email</h3>
                    <p class="opacity-90">info@nexaride.it</p>
                    <p class="opacity-90">prenotazioni@nexaride.it</p>
                </div>
                
                <div class="text-center">
                    <div class="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <i class="fab fa-whatsapp text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">WhatsApp</h3>
                    <p class="opacity-90">+39 312 345 6789</p>
                    <p class="opacity-90">Risposta rapida</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div class="md:col-span-2">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="bg-nexa-blue text-white p-2 rounded-lg">
                            <i class="fas fa-car text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold">NexaRide</h3>
                            <p class="text-sm opacity-75">Servizio NCC Premium</p>
                        </div>
                    </div>
                    <p class="opacity-90 mb-4">
                        Il tuo partner di fiducia per trasferimenti di lusso, viaggi d'affari e servizi personalizzati in tutta Italia.
                    </p>
                    <div class="flex space-x-4">
                        <a href="#" class="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <i class="fab fa-facebook"></i>
                        </a>
                        <a href="#" class="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="#" class="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <i class="fab fa-linkedin"></i>
                        </a>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-lg font-semibold mb-4">Servizi</h4>
                    <ul class="space-y-2 opacity-90">
                        <li><a href="#" class="hover:text-nexa-gold transition-colors">Aeroporti</a></li>
                        <li><a href="#" class="hover:text-nexa-gold transition-colors">Business</a></li>
                        <li><a href="#" class="hover:text-nexa-gold transition-colors">Eventi</a></li>
                        <li><a href="#" class="hover:text-nexa-gold transition-colors">Tours</a></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="text-lg font-semibold mb-4">Informazioni</h4>
                    <ul class="space-y-2 opacity-90">
                        <li><a href="#" class="hover:text-nexa-gold transition-colors">Chi Siamo</a></li>
                        <li><a href="#" class="hover:text-nexa-gold transition-colors">Flotta</a></li>
                        <li><a href="#" class="hover:text-nexa-gold transition-colors">Condizioni</a></li>
                        <li><a href="#" class="hover:text-nexa-gold transition-colors">Privacy</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="border-t border-gray-800 mt-8 pt-8 text-center opacity-75">
                <p>&copy; 2024 NexaRide. Tutti i diritti riservati. | P.IVA: 12345678901</p>
            </div>
        </div>
    </footer>

    <!-- Google Maps Script with Dynamic API Key -->
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps"></script>
    
    <!-- JavaScript Files -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/autocomplete.js"></script>
    <script src="/static/app.js"></script>
    
    <!-- Global Functions -->
    <script>
        function scrollToQuote() {
            document.getElementById('preventivo').scrollIntoView({ behavior: 'smooth' });
        }
        
        function initGoogleMaps() {
            console.log('Google Maps API loaded successfully');
            if (typeof NexaRideAutocomplete !== 'undefined') {
                window.nexaAutocomplete = new NexaRideAutocomplete();
                console.log('NexaRide Autocomplete initialized');
            }
        }

        // Initialize quote form when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof initQuoteForm === 'function') {
                initQuoteForm();
            }
        });
    </script>
</body>
</html>`
}

// API Routes
app.get('/api/hello', (c) => {
  return c.json({ message: 'NexaRide API is running!' })
})

app.get('/api/test', (c) => {
  return c.json({ 
    status: 'success',
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  })
})

// Routes principali con Google Maps API Key dal environment
app.get('/', (c) => {
  const googleMapsApiKey = c.env?.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
  return c.html(getMainHTML(googleMapsApiKey))
})

app.get('/admin', (c) => {
  const googleMapsApiKey = c.env?.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
  return c.html(getAdminHTML(googleMapsApiKey))
})

// Funzione per generare la pagina admin (puoi implementare qui la tua area amministrativa)
function getAdminHTML(googleMapsApiKey: string) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexaRide - Area Amministrativa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div class="text-center mb-6">
                <div class="bg-blue-600 text-white p-3 rounded-full inline-block mb-4">
                    <i class="fas fa-car text-2xl"></i>
                </div>
                <h1 class="text-2xl font-bold text-gray-800">NexaRide Admin</h1>
                <p class="text-gray-600">Area Riservata</p>
            </div>
            
            <form class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Inserisci username">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Inserisci password">
                </div>
                
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    Accedi
                </button>
            </form>
            
            <div class="mt-6 text-center">
                <a href="/" class="text-blue-600 hover:text-blue-700 text-sm">
                    <i class="fas fa-arrow-left mr-1"></i>
                    Torna al sito
                </a>
            </div>
        </div>
    </div>
</body>
</html>`
}

export default app
