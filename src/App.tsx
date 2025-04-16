import {useState} from "react";
import {Movie, MovieSearchParams, MovieSearchResponse} from "./types/movieApiTypes.ts";
import SearchBar from "./components/SearchBar.tsx";

//TODO: Add pagination
type SearchResults = {
    movies: Movie[],
    totalResults: number
}

function App() {
    const [searchResults, setSearchResult] = useState<SearchResults>();

    async function searchMovie({title, mediaType, year} : MovieSearchParams) {
        try {
            const url = new URL('http://www.omdbapi.com/');
            url.searchParams.set('apikey', import.meta.env.VITE_OMDB_API_KEY);
            url.searchParams.set("s", title);
            if (mediaType) url.searchParams.set("type", mediaType);
            if (year) url.searchParams.set("y", year.toString());

            const res = await fetch(url.toString());
            const data : MovieSearchResponse = await res.json();

            if (data.Response === "True") {
                const result : SearchResults = {
                    movies: data.Search,
                    totalResults: Number(data.totalResults)
                }
                setSearchResult(result);
            }
            if (data.Response === "False") {
                console.error(data.Error);
            }
        } catch (e) {
            console.error(e);
        }
    }

    /* TODO: Improve search
    *   - Get all results not just first 10 and allow for sorting.
    *   - Sort by year
    *   - Sort by type
    *   - Sort alphabetical.
    */

  return (<main>
      <h1>Search Movie</h1>
      <SearchBar searchMovies={searchMovie}/>
      <section>
          {searchResults && searchResults.movies.map(movie => <article key={movie.imdbID}>
              <img src={movie.Poster} alt={`Poster for the movie ${movie.Title}`}/>
              <h2>{movie.Title}</h2>
              <ul>
                  <li>{movie.Type}</li>
                  <li>{movie.Year}</li>
              </ul>
          </article>)}
      </section>
  </main>)
}

export default App