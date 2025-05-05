import {useState} from "react";
import {
    buildRequestPagesBundles,
    createSearchQuery,
    isOMDbSearchFail,
    isOMDbSearchResponse,
    Movie,
    OMDbSearchFail,
    OMDbSearchParams,
    OMDbSearchSuccess,
    validateOMDbSearchResponse
} from "./modules/OMDb.ts";
import SearchBar from "./components/SearchBar.tsx";
import MovieList from "./components/MovieList.tsx";
import {matchSettled} from "./modules/utils.ts";

type SearchResult = {
    movies: Movie[],
    totalResults: number,
    searchParams: OMDbSearchParams,
}

function App() {
    const [searchResult, setSearchResult] = useState<SearchResult>();

    async function searchMovie(searchParams : OMDbSearchParams) {
        try {
            //TODO: Add response validation
            const res = await fetch(createSearchQuery(searchParams));
            const data : unknown = await res.json();

            const onFail = (data: OMDbSearchFail) => {
                console.log("Search failed:", data.Error);
            }
            const onSuccess = (data: OMDbSearchSuccess) => {
                if (searchParams.sortBy) {
                    advancedMovieSearch(data ,searchParams);
                } else {
                    setSearchResult({
                        movies: data.Search,
                        totalResults: Number(data.totalResults),
                        searchParams: searchParams,
                    })
                }
            }

            validateOMDbSearchResponse(data, {
                onFail,
                onSuccess,
            })
        } catch (e) {
            console.error(e);
        }
    }

    /* TODO: Improve search
    *   - Sort by year
    *   - Sort by type
    *   - Sort alphabetical.
    */
    async function advancedMovieSearch(firstResult : OMDbSearchSuccess, searchParams : OMDbSearchParams) {
        const amountOfPages = Math.ceil(Number(firstResult.totalResults) / 10);
        const requestBundles = buildRequestPagesBundles(searchParams, amountOfPages)
        const searchResult : SearchResult = {
            movies: [...firstResult.Search],
            searchParams: {...searchParams},
            totalResults: Number(firstResult.totalResults),
        }

        const validateResponse = (response: Response) => {
            if (!response.ok) {
                //TODO: Handle not ok response
                console.error("Response not ok", response);
                return;
            }
            validateResult(response.json());
        }
        const validateResult = async (jsonPromise: Promise<unknown>) => {
            const data = await jsonPromise;
            validateOMDbSearchResponse(data, {
                onSuccess: sortAndPush,
                onFail: logError
            })
        }
        const sortAndPush = (result: OMDbSearchSuccess) => {
            //sort
            searchResult.movies.push(...result.Search);
            searchResult.movies.sort((a,b) => {
                const titleA = a.Title.toUpperCase();
                const titleB = b.Title.toUpperCase();
                if (titleA < titleB) return -1;
                if (titleA > titleB) return 1;
                return 0;
            });
            setSearchResult(searchResult);
        }
        const logError = (error: string | OMDbSearchFail) => {
            if (typeof error === "string") {
                console.log(error)
                return;
            }
            if (isOMDbSearchResponse(error) && isOMDbSearchFail(error)) {
                console.error(error.Error);
            }
        }

        for (const bundle of requestBundles){
            const settledPromises = await Promise.allSettled(bundle);
            for (const promise of settledPromises){
                matchSettled(promise, {
                    onFulfilled: validateResponse,
                    onRejected: logError
                });
            }
        }
    }

  return (<main>
      <h1>Search Movie</h1>
      <SearchBar searchMovies={searchMovie}
                 totalResults={searchResult && searchResult.totalResults}
                 searchParams={searchResult && searchResult.searchParams} />
      {(searchResult && searchResult.movies.length > 0) && <MovieList movieList={searchResult.movies}/>}
  </main>)
}

export default App