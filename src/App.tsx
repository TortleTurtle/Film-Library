import {useState} from "react";
import {
    isMovieSearchResponse,
    isMovieSearchResponseFail,
    isMovieSearchResponseSuccess,
    Movie,
    MovieSearchParams
} from "./types/movieApiTypes.ts";
import SearchBar from "./components/SearchBar.tsx";
import MovieList from "./components/MovieList.tsx";

type SearchResult = {
    movies: Movie[],
    totalResults: number,
    searchParams: MovieSearchParams,
}

function App() {
    const [searchResult, setSearchResult] = useState<SearchResult>();

    function createSearchQuery(searchParams : MovieSearchParams): string {
        const url = new URL('https://www.omdbapi.com/');
        url.searchParams.set('apikey', import.meta.env.VITE_OMDB_API_KEY);
        // Not very dry. Good enough for now.
        url.searchParams.set("s", searchParams.title);
        if (searchParams.mediaType) url.searchParams.set("type", searchParams.mediaType);
        if (searchParams.year) url.searchParams.set("y", searchParams.year.toString());
        if (searchParams.page) url.searchParams.set("page", searchParams.page.toString());
        return url.toString();
    }

    async function searchMovie(searchParams : MovieSearchParams) {
        console.log("searching Movies");
        try {
            const res = await fetch(createSearchQuery(searchParams));
            const data : unknown = await res.json();

            if (!isMovieSearchResponse(data)) {
                console.error("Response does not match type");
                return;
            }
            if (isMovieSearchResponseSuccess(data)) {
                const searchResult : SearchResult = {
                    movies: data.Search,
                    totalResults: Number(data.totalResults),
                    searchParams: {...searchParams} // creating a new object just be sure no recycling.
                }
                setSearchResult(searchResult);
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
    *   - Sort by year
    *   - Sort by type
    *   - Sort alphabetical.
    */
    async function advancedMovieSearch(searchParams : MovieSearchParams) {
        try {
            const firstResult = await fetch(createSearchQuery(searchParams));
            const firstData : unknown = await firstResult.json();

            if (!isMovieSearchResponse(firstData)) {
                console.error("Response does not match type");
                return;
            } else if (isMovieSearchResponseFail(firstData)) {
                console.error(firstData.Error);
                return;
            } else if (isMovieSearchResponseSuccess(firstData)) {
                const amountOfPages = Math.ceil(Number(firstData.totalResults) / 10);
                const movies = await fetchAllPages(amountOfPages, searchParams);
                const result : SearchResult = {
                    movies: [...firstData.Search, ...movies],
                    searchParams: {...searchParams},
                    totalResults: Number(firstData.totalResults),
                }
                /* TODO: AdvancedSearchResult type?
                *   - Know if internal pagination or external through api.
                */
                setSearchResult(result);
            } else {
             console.error("Unexpected movie search response");
            }
        }
        catch (e) {
            console.error(e);
        }
    }

    async function fetchAllPages(amountOfPages: number, searchParams: MovieSearchParams): Promise<Movie[]> {
        //Limit requests if we are developing.
        const maxPages = import.meta.env.MODE === "development" && amountOfPages > 5 ? 5 : amountOfPages;
        const promises: Promise<Response>[] = [];

        /* TODO: Figure out how many requests we are allowed to do at the same time.
        *   - tested up until 5 so far.
        *   - bundle fetch requests.
        */
        //starting at 2 because we already have the first page
        for (let pageNumber = 2; pageNumber <= maxPages; pageNumber++) {
            promises.push(fetch(createSearchQuery({...searchParams, page: pageNumber})))
        }
        const results = await Promise.all(promises);

        //concat all movies together. We could do this async as well.
        let movies: Movie[] = [];
        for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
            const data : unknown = await results[resultIndex].json();

            /* TODO: Retry failed responses
            *   - validate response status (200)
            *   - retry if 500 code.
            *   - if 403 or 404 code show error message.
             */
            if (!isMovieSearchResponse(data)) {
                throw new Error(`Response for page ${resultIndex + 1} does not match type`);
            } else if (isMovieSearchResponseFail(data)) {

                throw new Error(`Page ${resultIndex + 1} failed: ${data.Error}`);
            }
            else if (isMovieSearchResponseSuccess(data)) {
                movies = [...movies, ...data.Search];
            } else {
                throw new Error(`Unexpected movie search response for page ${resultIndex + 1}`)
            }
        }
        return movies;
    }

  return (<main>
      <h1>Search Movie</h1>
      <SearchBar searchMovies={advancedMovieSearch}
                 totalResults={searchResult && searchResult.totalResults}
                 searchParams={searchResult && searchResult.searchParams} />
      {(searchResult && searchResult.movies.length > 0) && <MovieList movieList={searchResult.movies}/>}
  </main>)
}

export default App