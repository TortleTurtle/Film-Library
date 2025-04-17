import {useState} from "react";
import {
    isMovieSearchResponse,
    isMovieSearchResponseFail,
    isMovieSearchResponseSuccess,
    Movie,
    MovieSearchParams
} from "./types/movieApiTypes.ts";
import SearchBar from "./components/SearchBar.tsx";

type SearchResult = {
    movies: Movie[],
    totalResults: number,
    searchParams: MovieSearchParams,
}

function App() {
    const [searchResult, setSearchResult] = useState<SearchResult>();

    async function searchMovie(searchParams : MovieSearchParams) {
        console.log("searching Movies");
        try {
            const url = new URL('http://www.omdbapi.com/');
            url.searchParams.set('apikey', import.meta.env.VITE_OMDB_API_KEY);
            // Not very dry. Good enough for now.
            url.searchParams.set("s", searchParams.title);
            if (searchParams.mediaType) url.searchParams.set("type", searchParams.mediaType);
            if (searchParams.year) url.searchParams.set("y", searchParams.year.toString());
            if (searchParams.page) url.searchParams.set("page", searchParams.page.toString());

            const res = await fetch(url.toString());
            const data : unknown = await res.json();

            if (!isMovieSearchResponse(data)) {
                console.error("Response does not match type");
                return;
            }
            if (isMovieSearchResponseSuccess(data)) {
                const result : SearchResult = {
                    movies: data.Search,
                    totalResults: Number(data.totalResults),
                    searchParams: {...searchParams} // destructring just to be sure.
                }
                setSearchResult(result);
            } else if (isMovieSearchResponseFail(data)) {
                console.error(data.Error);
            } else {
                const _exhaustiveCheck : never = data;
                return _exhaustiveCheck
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
      <SearchBar searchMovies={searchMovie}
                 totalResults={searchResult && searchResult.totalResults}
                 searchParams={searchResult && searchResult.searchParams} />
      <section>
          {searchResult && searchResult.movies.map(movie => <article key={movie.imdbID}>
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