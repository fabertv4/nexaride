import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  GOOGLE_MAPS_API_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for all routes
app.use('*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Main HTML template function with Google Maps API key
function getMainHTML(googleMapsApiKey: string = 'YOUR_GOOGLE_MAPS_API_KEY') {
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexaRide - Trasferimenti Premium dall'Aeroporto</title>
    <meta name="description" content="Servizi di trasferimento premium dall'aeroporto. Prenota il tuo trasferimento con conducenti professionali e veicoli di lusso.">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Font Awesome -->
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link href="/static/styles.css" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#1e40af',
                        secondary: '#f59e0b',
                        accent: '#10b981'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-lg sticky top-0 z-50">
        <nav class="container mx-auto px-4 py-3">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-car text-primary text-2xl"></i>
                    <h1 class="text-2xl font-bold text-gray-800">NexaRide</h1>
                </div>
                <div class="hidden md:flex items-center space-x-6">
                    <a href="#servizi" class="text-gray-600 hover:text-primary transition">Servizi</a>
                    <a href="#flotta" class="text-gray-600 hover:text-primary transition">Flotta</a>
                    <a href="#contatti" class="text-gray-600 hover:text-primary transition">Contatti</a>
                    <button onclick="showLoginModal()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-user mr-2"></i>Accedi
                    </button>
                </div>
                <button class="md:hidden text-gray-600" onclick="toggleMobileMenu()">
                    <i class="fas fa-bars text-xl"></i>
                </button>
            </div>
            
            <!-- Mobile Menu -->
            <div id="mobileMenu" class="hidden md:hidden mt-4 pb-4">
                <div class="flex flex-col space-y-3">
                    <a href="#servizi" class="text-gray-600 hover:text-primary transition">Servizi</a>
                    <a href="#flotta" class="text-gray-600 hover:text-primary transition">Flotta</a>
                    <a href="#contatti" class="text-gray-600 hover:text-primary transition">Contatti</a>
                    <button onclick="showLoginModal()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-left">
                        <i class="fas fa-user mr-2"></i>Accedi
                    </button>
                </div>
            </div>
        </nav>
    </header>

    <!-- Hero Section with Booking -->
    <section class="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
        <div class="container mx-auto px-4">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
                <!-- Left Column - Content -->
                <div>
                    <h2 class="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                        Trasferimenti Premium dall'Aeroporto
                    </h2>
                    <p class="text-xl mb-8 text-blue-100">
                        Servizio di trasferimento di lusso con conducenti professionali. Prenota ora e viaggia in comfort e stile.
                    </p>
                    <div class="flex flex-wrap gap-4 mb-8">
                        <div class="flex items-center">
                            <i class="fas fa-check-circle text-green-400 mr-2"></i>
                            <span>Conducenti Professionali</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-check-circle text-green-400 mr-2"></i>
                            <span>Veicoli di Lusso</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-check-circle text-green-400 mr-2"></i>
                            <span>Tracciamento in Tempo Reale</span>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Booking Form -->
                <div class="bg-white rounded-2xl shadow-2xl p-8">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-800 mb-2">Richiedi un Preventivo</h3>
                        <p class="text-gray-600">Calcola il prezzo del tuo trasferimento</p>
                    </div>

                    <form id="quoteForm" class="space-y-4">
                        <!-- Trip Type -->
                        <div class="grid grid-cols-2 gap-2 mb-4">
                            <button type="button" id="oneWayBtn" class="trip-type-btn active p-3 rounded-lg border-2 transition" onclick="setTripType('one-way')">
                                <i class="fas fa-arrow-right mr-2"></i>Solo Andata
                            </button>
                            <button type="button" id="roundTripBtn" class="trip-type-btn p-3 rounded-lg border-2 transition" onclick="setTripType('round-trip')">
                                <i class="fas fa-exchange-alt mr-2"></i>Andata e Ritorno
                            </button>
                        </div>

                        <!-- Pickup Location -->
                        <div class="space-y-2">
                            <label class="block text-sm font-semibold text-gray-700">
                                <i class="fas fa-map-marker-alt text-green-500 mr-2"></i>Luogo di Ritiro
                            </label>
                            <div class="relative">
                                <input type="text" id="pickup" name="pickup" 
                                       class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                       placeholder="Inserisci indirizzo di partenza">
                                <div id="pickupSuggestions" class="autocomplete-suggestions"></div>
                            </div>
                        </div>

                        <!-- Destination -->
                        <div class="space-y-2">
                            <label class="block text-sm font-semibold text-gray-700">
                                <i class="fas fa-map-marker-alt text-red-500 mr-2"></i>Destinazione
                            </label>
                            <div class="relative">
                                <input type="text" id="destination" name="destination"
                                       class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                       placeholder="Inserisci destinazione">
                                <div id="destinationSuggestions" class="autocomplete-suggestions"></div>
                            </div>
                        </div>

                        <!-- Stops Container -->
                        <div id="stopsContainer" class="space-y-2">
                            <!-- Stops will be added here dynamically -->
                        </div>

                        <!-- Add Stop Button -->
                        <button type="button" onclick="addStop()" class="w-full p-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition">
                            <i class="fas fa-plus mr-2"></i>Aggiungi Tappa
                        </button>

                        <!-- Date and Time -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="block text-sm font-semibold text-gray-700">
                                    <i class="fas fa-calendar text-blue-500 mr-2"></i>Data
                                </label>
                                <input type="date" id="date" name="date" required
                                       class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>
                            <div class="space-y-2">
                                <label class="block text-sm font-semibold text-gray-700">
                                    <i class="fas fa-clock text-purple-500 mr-2"></i>Orario
                                </label>
                                <input type="time" id="time" name="time" required
                                       class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>
                        </div>

                        <!-- Passengers -->
                        <div class="space-y-2">
                            <label class="block text-sm font-semibold text-gray-700">
                                <i class="fas fa-users text-orange-500 mr-2"></i>Numero Passeggeri
                            </label>
                            <select id="passengers" name="passengers" required
                                    class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="1">1 Passeggero</option>
                                <option value="2">2 Passeggeri</option>
                                <option value="3">3 Passeggeri</option>
                                <option value="4">4 Passeggeri</option>
                                <option value="5">5 Passeggeri</option>
                                <option value="6">6 Passeggeri</option>
                                <option value="7">7 Passeggeri</option>
                                <option value="8">8+ Passeggeri</option>
                            </select>
                        </div>

                        <!-- Quote Display -->
                        <div id="quoteDisplay" class="hidden bg-gray-50 p-4 rounded-lg border">
                            <div class="text-center">
                                <div class="text-sm text-gray-600 mb-2">Preventivo Stimato</div>
                                <div id="quoteAmount" class="text-2xl font-bold text-primary">€0</div>
                                <div id="quoteDetails" class="text-xs text-gray-500 mt-1"></div>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="w-full bg-primary text-white p-4 rounded-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105">
                            <i class="fas fa-calculator mr-2"></i>Calcola Preventivo
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Vehicle Selection Modal -->
    <div id="vehicleModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">Seleziona il tuo Veicolo</h3>
                    <button onclick="closeVehicleModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div id="vehicleOptions" class="grid gap-4">
                    <!-- Vehicle options will be populated here -->
                </div>
                
                <div class="mt-6 text-center">
                    <button onclick="closeVehicleModal()" class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Services Section -->
    <section id="servizi" class="py-16 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-12">
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">I Nostri Servizi</h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Offriamo una gamma completa di servizi di trasporto premium per ogni esigenza
                </p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Airport Transfer -->
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-plane text-white text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-4">Trasferimenti Aeroportuali</h3>
                        <p class="text-gray-600 mb-6">
                            Servizio porta a porta da e per tutti i principali aeroporti con monitoraggio voli in tempo reale.
                        </p>
                        <ul class="text-sm text-gray-600 space-y-2">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Monitoraggio voli</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Meet & Greet</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Assistenza bagagli</li>
                        </ul>
                    </div>
                </div>

                <!-- Business Transport -->
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-briefcase text-white text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-4">Trasporto Business</h3>
                        <p class="text-gray-600 mb-6">
                            Soluzioni di trasporto executive per meeting, conferenze e viaggi di lavoro.
                        </p>
                        <ul class="text-sm text-gray-600 space-y-2">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Veicoli executive</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Wi-Fi a bordo</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Servizio su prenotazione</li>
                        </ul>
                    </div>
                </div>

                <!-- Special Events -->
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-calendar-check text-white text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-4">Eventi Speciali</h3>
                        <p class="text-gray-600 mb-6">
                            Trasporto di lusso per matrimoni, feste e occasioni speciali.
                        </p>
                        <ul class="text-sm text-gray-600 space-y-2">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Veicoli decorati</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Servizio personalizzato</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Pacchetti evento</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Fleet Section -->
    <section id="flotta" class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-12">
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">La Nostra Flotta</h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Veicoli moderni e confortevoli per ogni tipo di viaggio
                </p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Economy -->
                <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-car text-green-600 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-gray-800 mb-2">Economy</h3>
                        <p class="text-gray-600 text-sm mb-4">1-3 passeggeri</p>
                        <p class="text-2xl font-bold text-green-600">€25+</p>
                        <p class="text-xs text-gray-500">a partire da</p>
                    </div>
                </div>

                <!-- Comfort -->
                <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-car-side text-blue-600 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-gray-800 mb-2">Comfort</h3>
                        <p class="text-gray-600 text-sm mb-4">1-4 passeggeri</p>
                        <p class="text-2xl font-bold text-blue-600">€35+</p>
                        <p class="text-xs text-gray-500">a partire da</p>
                    </div>
                </div>

                <!-- Business -->
                <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-user-tie text-purple-600 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-gray-800 mb-2">Business</h3>
                        <p class="text-gray-600 text-sm mb-4">1-3 passeggeri</p>
                        <p class="text-2xl font-bold text-purple-600">€55+</p>
                        <p class="text-xs text-gray-500">a partire da</p>
                    </div>
                </div>

                <!-- Van -->
                <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
                    <div class="text-center">
                        <div class="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-shuttle-van text-orange-600 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-gray-800 mb-2">Van</h3>
                        <p class="text-gray-600 text-sm mb-4">5-8 passeggeri</p>
                        <p class="text-2xl font-bold text-orange-600">€75+</p>
                        <p class="text-xs text-gray-500">a partire da</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contatti" class="py-16 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-12">
                <h2 class="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Contattaci</h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Siamo disponibili 24/7 per assistenza e prenotazioni
                </p>
            </div>

            <div class="grid lg:grid-cols-2 gap-12">
                <!-- Contact Info -->
                <div class="space-y-8">
                    <div class="flex items-start space-x-4">
                        <div class="bg-primary w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-phone text-white"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 mb-2">Telefono</h3>
                            <p class="text-gray-600">+39 123 456 7890</p>
                            <p class="text-sm text-gray-500">Disponibile 24/7</p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-4">
                        <div class="bg-secondary w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-envelope text-white"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 mb-2">Email</h3>
                            <p class="text-gray-600">info@nexaride.it</p>
                            <p class="text-sm text-gray-500">Risposta entro 1 ora</p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-4">
                        <div class="bg-accent w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-map-marker-alt text-white"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 mb-2">Sede</h3>
                            <p class="text-gray-600">Via Roma 123, 00100 Roma, Italia</p>
                            <p class="text-sm text-gray-500">Lun-Ven 9:00-18:00</p>
                        </div>
                    </div>
                </div>

                <!-- Contact Form -->
                <div class="bg-gray-50 p-8 rounded-2xl">
                    <form class="space-y-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
                            <input type="text" class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Il tuo nome">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input type="email" class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="la-tua-email@esempio.com">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Messaggio</label>
                            <textarea rows="4" class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Come possiamo aiutarti?"></textarea>
                        </div>

                        <button type="submit" class="w-full bg-primary text-white p-4 rounded-lg font-semibold hover:bg-blue-700 transition">
                            <i class="fas fa-paper-plane mr-2"></i>Invia Messaggio
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12">
        <div class="container mx-auto px-4">
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                    <div class="flex items-center space-x-2 mb-4">
                        <i class="fas fa-car text-primary text-2xl"></i>
                        <h3 class="text-xl font-bold">NexaRide</h3>
                    </div>
                    <p class="text-gray-300 mb-4">
                        Il tuo partner di fiducia per trasferimenti premium dall'aeroporto.
                    </p>
                    <div class="flex space-x-4">
                        <a href="#" class="text-gray-300 hover:text-primary transition">
                            <i class="fab fa-facebook text-xl"></i>
                        </a>
                        <a href="#" class="text-gray-300 hover:text-primary transition">
                            <i class="fab fa-instagram text-xl"></i>
                        </a>
                        <a href="#" class="text-gray-300 hover:text-primary transition">
                            <i class="fab fa-twitter text-xl"></i>
                        </a>
                    </div>
                </div>

                <div>
                    <h4 class="font-bold mb-4">Servizi</h4>
                    <ul class="space-y-2 text-gray-300">
                        <li><a href="#" class="hover:text-primary transition">Trasferimenti Aeroportuali</a></li>
                        <li><a href="#" class="hover:text-primary transition">Trasporto Business</a></li>
                        <li><a href="#" class="hover:text-primary transition">Eventi Speciali</a></li>
                        <li><a href="#" class="hover:text-primary transition">Tour Privati</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold mb-4">Informazioni</h4>
                    <ul class="space-y-2 text-gray-300">
                        <li><a href="#" class="hover:text-primary transition">Chi Siamo</a></li>
                        <li><a href="#" class="hover:text-primary transition">La Nostra Flotta</a></li>
                        <li><a href="#" class="hover:text-primary transition">Termini e Condizioni</a></li>
                        <li><a href="#" class="hover:text-primary transition">Privacy Policy</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold mb-4">Contatti</h4>
                    <ul class="space-y-2 text-gray-300">
                        <li>
                            <i class="fas fa-phone mr-2"></i>
                            +39 123 456 7890
                        </li>
                        <li>
                            <i class="fas fa-envelope mr-2"></i>
                            info@nexaride.it
                        </li>
                        <li>
                            <i class="fas fa-map-marker-alt mr-2"></i>
                            Via Roma 123, Roma
                        </li>
                    </ul>
                </div>
            </div>

            <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
                <p>&copy; 2024 NexaRide. Tutti i diritti riservati.</p>
            </div>
        </div>
    </footer>

    <!-- Login Modal -->
    <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-8">
            <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-gray-800 mb-2">Accedi al Sistema</h3>
                <p class="text-gray-600">Inserisci le tue credenziali</p>
            </div>

            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <input type="text" id="username" required
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           placeholder="Inserisci username">
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <input type="password" id="password" required
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           placeholder="Inserisci password">
                </div>

                <button type="submit" class="w-full bg-primary text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                    <i class="fas fa-sign-in-alt mr-2"></i>Accedi
                </button>

                <div class="text-center">
                    <button type="button" onclick="closeLoginModal()" class="text-gray-500 hover:text-gray-700">
                        Annulla
                    </button>
                </div>
            </form>

            <!-- Demo Credentials -->
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-600 text-center mb-2">Credenziali Demo:</p>
                <div class="text-xs text-gray-500 space-y-1">
                    <div>Admin: admin / test123</div>
                    <div>Operatore: operator / operator123</div>
                    <div>Demo: demo / demo123</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
        <div class="bg-white rounded-2xl p-8 text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p class="text-gray-600">Caricamento in corso...</p>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps"></script>
    <script src="/static/autocomplete.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>`
}

// Routes
app.get('/', (c) => {
  const googleMapsApiKey = c.env?.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
  return c.html(getMainHTML(googleMapsApiKey))
})

// API Routes
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'NexaRide API is running'
  })
})

// Login endpoint
app.post('/api/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    // Demo credentials
    const validCredentials = [
      { username: 'admin', password: 'test123', role: 'admin' },
      { username: 'operator', password: 'operator123', role: 'operator' },
      { username: 'demo', password: 'demo123', role: 'demo' }
    ]
    
    const user = validCredentials.find(u => u.username === username && u.password === password)
    
    if (user) {
      return c.json({
        success: true,
        user: { username: user.username, role: user.role },
        message: `Benvenuto, ${user.username}!`
      })
    } else {
      return c.json({
        success: false,
        message: 'Credenziali non valide'
      }, 401)
    }
  } catch (error) {
    return c.json({
      success: false,
      message: 'Errore nel server'
    }, 500)
  }
})

// Quote calculation endpoint
app.post('/api/quote', async (c) => {
  try {
    const quoteData = await c.req.json()
    console.log('Quote request:', quoteData)
    
    // Basic quote calculation
    let basePrice = 35
    const passengers = parseInt(quoteData.passengers) || 1
    
    // Vehicle type pricing
    if (passengers <= 3) basePrice = 35      // Economy/Comfort
    else if (passengers <= 4) basePrice = 45 // Comfort+
    else if (passengers <= 6) basePrice = 65 // Business
    else basePrice = 85                       // Van
    
    // Add distance factor (simplified)
    const estimatedPrice = Math.round(basePrice * (1 + Math.random() * 0.5))
    
    const vehicles = [
      {
        type: 'Economy',
        price: estimatedPrice,
        capacity: '1-3 passeggeri',
        features: ['Aria condizionata', 'WiFi gratuito'],
        available: passengers <= 3
      },
      {
        type: 'Comfort',
        price: Math.round(estimatedPrice * 1.3),
        capacity: '1-4 passeggeri',
        features: ['Sedili in pelle', 'Acqua gratuita', 'WiFi gratuito'],
        available: passengers <= 4
      },
      {
        type: 'Business',
        price: Math.round(estimatedPrice * 1.8),
        capacity: '1-3 passeggeri',
        features: ['Veicolo di lusso', 'Giornali', 'Bevande', 'WiFi Premium'],
        available: passengers <= 3
      },
      {
        type: 'Van',
        price: Math.round(estimatedPrice * 2.2),
        capacity: '5-8 passeggeri',
        features: ['Spazio bagagli XL', 'Sedili reclinabili', 'WiFi gratuito'],
        available: passengers >= 5
      }
    ].filter(v => v.available)
    
    return c.json({
      success: true,
      quote: {
        estimatedPrice,
        vehicles,
        route: {
          pickup: quoteData.pickup,
          destination: quoteData.destination,
          stops: quoteData.stops || []
        }
      }
    })
  } catch (error) {
    console.error('Quote error:', error)
    return c.json({
      success: false,
      message: 'Errore nel calcolo del preventivo'
    }, 500)
  }
})

export default app
