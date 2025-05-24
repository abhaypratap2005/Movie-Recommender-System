
const API_KEY = "70048dce50f510d63a99ef8297c4928b"; 
let selectedGenres = [];

// TMDb Genre IDs
const allGenres = [
    { name: "Action", id: 28 },
    { name: "Adventure", id: 12 },
    { name: "Animation", id: 16 },
    { name: "Comedy", id: 35 },
    { name: "Crime", id: 80 },
    { name: "Documentary", id: 99 },
    { name: "Drama", id: 18 },
    { name: "Family", id: 10751 },
    { name: "Fantasy", id: 14 },
    { name: "History", id: 36 },
    { name: "Horror", id: 27 },
    { name: "Music", id: 10402 },
    { name: "Mystery", id: 9648 },
    { name: "Romance", id: 10749 },
    { name: "Science Fiction", id: 878 }, // Note: "Sci-Fi" is officially "Science Fiction"
    { name: "TV Movie", id: 10770 },
    { name: "Thriller", id: 53 },
    { name: "War", id: 10752 },
    { name: "Western", id: 37 }
];

// DOM elements
const genreContainer = document.getElementById('genre-container');
const yearPref = document.getElementById('year-pref');
const getRecBtn = document.getElementById('get-recommendations');
const backBtn = document.getElementById('back-btn');
const prefSection = document.getElementById('preferences-section');
const resultsSection = document.getElementById('results-section');
const recContainer = document.getElementById('recommendations-container');

// Initialize the app
function initApp() {
    createGenreButtons();
    setupEventListeners();
}

// Create genre selection buttons
function createGenreButtons() {
    genreContainer.innerHTML = '';
    allGenres.forEach(genre => {
        const btn = document.createElement('button');
        btn.className = 'genre-btn';
        btn.textContent = genre.name;
        btn.dataset.id = genre.id;
        btn.addEventListener('click', () => toggleGenreSelection(genre.id, btn));
        genreContainer.appendChild(btn);
    });
}

// Toggle genre selection
function toggleGenreSelection(genreId, btn) {
    if (selectedGenres.includes(genreId)) {
        selectedGenres = selectedGenres.filter(id => id !== genreId);
        btn.classList.remove('selected');
    } else {
        selectedGenres.push(genreId);
        btn.classList.add('selected');
    }
}

// Set up event listeners
function setupEventListeners() {
    getRecBtn.addEventListener('click', getRecommendations);
    backBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        prefSection.classList.remove('hidden');
    });
}

// Get movie recommendations
async function getRecommendations() {
    if (selectedGenres.length === 0) {
        alert('Please select at least one genre');
        return;
    }

    recContainer.innerHTML = '<p class="loading">Loading recommendations...</p>';
    resultsSection.classList.remove('hidden');
    prefSection.classList.add('hidden');

    try {
        // Get movies for all selected genres
        const movies = await Promise.all(
            selectedGenres.map(genreId => fetchMoviesByGenre(genreId))
        ).then(results => results.flat());

        // Filter and sort movies
        const filteredMovies = filterMovies(movies);
        
        // Display results
        displayRecommendations(filteredMovies.slice(0, 10));
    } catch (error) {
        console.error("Error:", error);
        recContainer.innerHTML = '<p class="error">Failed to load recommendations. Please try again.</p>';
    }
}

// Fetch movies by genre from TMDb API
async function fetchMoviesByGenre(genreId) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}` +
            `&with_genres=${genreId}&sort_by=popularity.desc&page=1`
        );
        
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        
        const data = await response.json();
        return data.results?.map(movie => formatMovieData(movie)) || [];
    } catch (error) {
        console.error(`Error fetching ${genreId}:`, error);
        return [];
    }
}

// Format movie data
function formatMovieData(movie) {
    return {
        id: movie.id,
        title: movie.title,
        genres: movie.genre_ids.map(id => {
            const genre = allGenres.find(g => g.id === id);
            return genre ? genre.name : 'Unknown';
        }),
        year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : 0,
        rating: movie.vote_average || 0,
        description: movie.overview || "No description available",
        poster: movie.poster_path ? 
            `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
            null
    };
}

// Filter movies based on user preferences
function filterMovies(movies) {
    let filtered = [...movies];
    
    // Filter by year preference
    const yearValue = parseInt(yearPref.value);
    if (yearValue === 0) {
        filtered = filtered.filter(movie => movie.year < 2000);
    } else if (yearValue === 2) {
        filtered = filtered.filter(movie => movie.year >= 2010);
    }

    // Sort by rating (highest first)
    return filtered.sort((a, b) => b.rating - a.rating);
}

// Display recommendations
function displayRecommendations(recommendations) {
    recContainer.innerHTML = '';
    
    if (recommendations.length === 0) {
        recContainer.innerHTML = '<p class="no-results">No movies match your criteria. Try different filters.</p>';
        return;
    }

    recommendations.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        const posterHTML = movie.poster 
            ? `<img src="${movie.poster}" alt="${movie.title}" class="movie-poster">`
            : `<div class="movie-poster">${movie.title.substring(0, 1)}</div>`;
        
        card.innerHTML = `
            ${posterHTML}
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.year} • ${movie.genres.join(', ')}</span><br>
                    <span>⭐ ${movie.rating.toFixed(1)}/10</span>
                </div>
                <p>${movie.description}</p>
            </div>
        `;
        
        recContainer.appendChild(card);
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp);