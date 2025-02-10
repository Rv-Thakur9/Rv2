const apiKey = "YOUR API KEY"; // Replace with your API key
const searchButton = document.getElementById("searchButton");
const searchQuery = document.getElementById("searchQuery");
const resultsDiv = document.getElementById("results");
const mapDiv = document.getElementById("map");

let map;
let service;

function initMap(lat = 19.076, lng = 72.8777) {
  // Initialize the map centered at a default location (e.g., Mumbai)
  map = new google.maps.Map(mapDiv, {
    center: { lat, lng },
    zoom: 14,
  });
}

searchButton.addEventListener("click", () => {
  const query = searchQuery.value.trim();

  if (!query) {
    alert("Please enter a business name or type!");
    return;
  }

  // Perform Places Text Search
  const request = {
    query: query,
    fields: ["name", "geometry", "place_id", "formatted_address", "rating"],
  };

  resultsDiv.innerHTML = "<p>Loading...</p>";

  service = new google.maps.places.PlacesService(map);
  service.textSearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      resultsDiv.innerHTML = ""; // Clear previous results
      results.forEach((place) => displayPlace(place));

      // Center the map on the first result
      map.setCenter(results[0].geometry.location);
    } else {
      resultsDiv.innerHTML = "<p>No results found!</p>";
    }
  });
});

function displayPlace(place) {
  const placeDiv = document.createElement("div");
  placeDiv.innerHTML = `
    <strong>${place.name}</strong><br>
    Address: ${place.formatted_address || "N/A"}<br>
    Rating: ${place.rating || "N/A"}<br>
    <button onclick="fetchPlaceDetails('${place.place_id}')">View Reviews</button>
  `;
  resultsDiv.appendChild(placeDiv);

  // Add marker on the map
  new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    title: place.name,
  });
}

function fetchPlaceDetails(placeId) {
  const request = {
    placeId: placeId,
    fields: ["name", "formatted_address", "reviews"],
  };

  service.getDetails(request, (place, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      displayReviews(place);
    } else {
      alert("Could not fetch details for this place.");
      console.error('Error fetching place details:', status);
    }
  });
}

async function displayReviews(place) {
  try {
    // Preserve the map and search functionality
    const reviewsContainer = document.createElement("div");
    reviewsContainer.innerHTML = `
      <h2>${place.name}</h2>
      <p>Address: ${place.formatted_address}</p>
      <h3>Reviews:</h3>
    `;

    if (place.reviews && place.reviews.length > 0) {
      const allPositiveKeywords = [];
      const allNegativeKeywords = [];

      for (const review of place.reviews) {
        const { positiveKeywords, negativeKeywords } = await analyzeReview(review.text);
        allPositiveKeywords.push(...positiveKeywords);
        allNegativeKeywords.push(...negativeKeywords);

        const reviewDiv = document.createElement("div");
        reviewDiv.classList.add('review');
        reviewDiv.innerHTML = `
          <strong>${review.author_name}</strong>: ${review.text}<br>
          Rating: ${review.rating} / 5
        `;
        reviewsContainer.appendChild(reviewDiv);
      }

      console.log('Positive Keywords:', allPositiveKeywords);
      console.log('Negative Keywords:', allNegativeKeywords);

      reviewsContainer.innerHTML += `
        <h3>Positive Keywords:</h3>
        <p>${allPositiveKeywords.length > 0 ? allPositiveKeywords.map(keyword => `<span class="keyword positive">${keyword}</span>`).join(' ') : 'None'}</p>
        <h3>Negative Keywords:</h3>
        <p>${allNegativeKeywords.length > 0 ? allNegativeKeywords.map(keyword => `<span class="keyword negative">${keyword}</span>`).join(' ') : 'None'}</p>
      `;
    } else {
      reviewsContainer.innerHTML += "<p>No reviews available for this place.</p>";
    }

    resultsDiv.innerHTML = ""; // Clear previous results
    resultsDiv.appendChild(reviewsContainer);
  } catch (error) {
    console.error('Error displaying reviews:', error);
    alert('An error occurred while displaying reviews.');
  }
}

async function analyzeReview(text) {
  try {
    const response = await fetch('http://localhost:5000/analyzeReview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze review');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing review:', error);
    return { positiveKeywords: [], negativeKeywords: [] };
  }
}

// Initialize the map when the page loads
window.onload = () => initMap();
