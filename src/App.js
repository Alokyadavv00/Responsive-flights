import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  // User input states
  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Derived data states
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store your RapidAPI credentials in a .env file if possible
  const RAPIDAPI_KEY = "e69ee9dba6mshe67f3d5af7a0e50p130161jsne6d6fddc0026" || "YOUR-KEY-HERE";
  const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";

  // 1) Fetch airport data
  const fetchAirportData = async (query) => {
    const url = `https://${RAPIDAPI_HOST}/api/v1/flights/searchAirport`;
    const options = {
      method: "GET",
      url,
      params: { query },
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    };

    const response = await axios.request(options);
    // The data structure typically looks like: { data: [ { skyId, entityId }, ... ] }
    if (
      response.data &&
      Array.isArray(response.data.data) &&
      response.data.data.length > 0
    ) {
      return {
        skyId: response.data.data[0].skyId,
        entityId: response.data.data[0].entityId,
      };
    } else {
      throw new Error(`No airport found for "${query}"`);
    }
  };

  // 2) Fetch flights
  const fetchFlights = async ({
    originSkyId,
    originEntityId,
    destinationSkyId,
    destinationEntityId,
    date,
    returnDate,
  }) => {
    const url = `https://${RAPIDAPI_HOST}/api/v1/flights/searchFlights`;

    // Minimal required params
    const params = {
      originSkyId,
      originEntityId,
      destinationSkyId,
      destinationEntityId,
      date, // in YYYY-MM-DD
    };

    // Add optional returnDate if provided
    if (returnDate) {
      params.returnDate = returnDate;
    }

    // Add recommended/optional params
    params.adults = 1;
    params.cabinClass = "economy";
    params.currency = "USD";
    params.market = "en-US";
    params.countryCode = "US";

    const options = {
      method: "GET",
      url,
      params,
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    };

    const response = await axios.request(options);
    // Return entire payload (the top-level JSON)
    return response.data; 
  };

  // Main handler
  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setFlights([]);

    try {
      // 1) Get origin
      const originData = await fetchAirportData(originInput);

      // 2) Get destination
      const destinationData = await fetchAirportData(destinationInput);

      // 3) Fetch flights
      const flightsResponse = await fetchFlights({
        originSkyId: originData.skyId,
        originEntityId: originData.entityId,
        destinationSkyId: destinationData.skyId,
        destinationEntityId: destinationData.entityId,
        date: departureDate,
        returnDate: returnDate,
      });

      // Always log the full response to confirm the shape
      console.log("Flights Response:", flightsResponse);

      // Typically: flightsResponse.data = { flights: [...], context: {...} }
      if (
        flightsResponse &&
        flightsResponse.data &&
        flightsResponse.data.context &&
        flightsResponse.data.context.status === "failure"
      ) {
        // If the API explicitly reports failure
        setError(
          `No flights found. Total Results: ` +
            flightsResponse.data.context.totalResults
        );
      } else {
        // Attempt to grab flights array
        const resultFlights = flightsResponse?.data?.flights || [];
        if (resultFlights.length === 0) {
          setError("No flights found for the specified criteria.");
        }
        setFlights(resultFlights);
      }
    } catch (err) {
      console.error("Error fetching flights:", err);
      setError(err.message || "An error occurred while fetching flight data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Flight Search</h1>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="form-row">
          <label>
            Origin (City or Airport):
            <input
              type="text"
              placeholder="e.g. Dubai"
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              required
            />
          </label>
          <label>
            Destination (City or Airport):
            <input
              type="text"
              placeholder="e.g. London"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Departure Date:
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              required
            />
          </label>
          <label>
            Return Date:
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search Flights"}
        </button>
      </form>

      {/* Error message */}
      {error && <p className="error">{error}</p>}

      {/* Flight results */}
      <div className="results">
        {flights.length > 0 ? (
          flights.map((flight, index) => (
            <div key={index} className="flight-card">
              <h3>
                {flight.airline} {flight.flightNumber}
              </h3>
              <p>
                Departure: {flight.departureTime} | Arrival: {flight.arrivalTime}
              </p>
              <p>Price: {flight.price}</p>
            </div>
          ))
        ) : (
          !loading && <p>No flights found. Please try a different search.</p>
        )}
      </div>
    </div>
  );
};

export default App;
