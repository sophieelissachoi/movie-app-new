import React from 'react'
import { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import { updateSearchCount, getTrendingMovies } from './appwrite.js';
import Search from './Components/Search.jsx'
import Spinner from './Components/Spinner.jsx'
import MovieCard from './Components/MovieCard.jsx'

//API- Application Programming Interface- a set of rules that allows on software app to talk to another
const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');


  //debounces the search term to prevent making too many API requests
  //by waiting for the user to stop typing for 500ms
  useDebounce( () => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '') => {

    //shows the loading spinner
    setIsLoading(true);
    setErrorMessage("");

    try {
      //if user is typing in the search bar, show the movies, else, show movies by descending popularity
      const endpoint = query 
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      
      //access the API
      const response = await fetch(endpoint, API_OPTIONS);

      //show error if the API can't be accessed
      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      //if API is accessed, set the movie list to the API movie objects
      const data = await response.json();

      if (data.Response == 'False') {
        setErrorMessage( data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      //implements algorithm to count searches
      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
      
      //if there is an error, show "error fetching movies"
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage("Error fetching movies. Please try again later.");
    } finally {
      //after everything runs, turn the loading spinner off
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fretching trending movies: ${error}`);
    }
  }

  //if searchTerm changes, run useEffect
  useEffect( () => {
    fetchMovies(debouncedSearchTerm);
    console.log("API Key:", import.meta.env.VITE_TMDB_API_KEY);
  }, [debouncedSearchTerm]);

  useEffect( () => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className = "pattern" />

      <div className = "wrapper">
        <header>
          <img src = "./hero.png" alt = "Hero Banner" />
          <h1>Find <span className = "text-gradient"> Movies </span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm = {searchTerm} setSearchTerm = {setSearchTerm}/>
        </header>

        {trendingMovies.length > 0 && (
          <section className = "trending">
            <h2> Trending Movies </h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key = {movie.$id}>
                  <p> {index + 1} </p>
                  <img src = {movie.poster_url} alt = {movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className = "all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner/>
          ) : errorMessage ? (
            <p className = "text-red-500"> {errorMessage} </p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key = {movie.id} movie = {movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
