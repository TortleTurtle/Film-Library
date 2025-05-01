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
        console.log("searching Movies");
        try {
            const res = await fetch(createSearchQuery(searchParams));
            const data : unknown = await res.json();

            const onFail = (data: OMDbSearchFail) => {
                //TODO: User message.
                console.log("Search failed:", data.Error);
            }
            const onSuccess = (data: OMDbSearchSuccess) => {
                setSearchResult({
                    movies: data.Search,
                    totalResults: Number(data.totalResults),
                    searchParams: searchParams,
                })
            }

            validateOMDbSearchResponse(data, {
                onFail: onFail,
                onSuccess: onSuccess,
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
    async function advancedMovieSearch(searchParams : OMDbSearchParams) {
        try {
            const response = await fetch(createSearchQuery(searchParams));
            const data : unknown = await response.json();

            const onFail = async (data: OMDbSearchFail) => {
                //TODO: Show User message.
                console.error("Search failed:", data.Error);
            }
            const onSuccess = async (data: OMDbSearchSuccess) => {
                const amountOfPages = Math.ceil(Number(data.totalResults) / 10);
                const requestPagesBundles = buildRequestPagesBundles(searchParams, amountOfPages)

                const movies = await fetchAndParseAllPages(requestPagesBundles);
                const result : SearchResult = {
                    movies: [...data.Search, ...movies],
                    searchParams: {...searchParams},
                    totalResults: Number(data.totalResults),
                }
                /* TODO: AdvancedSearchResult type?
                *   - Know if internal pagination or external through api.
                */
                setSearchResult(result);
            }


            validateOMDbSearchResponse(data, {
                onSuccess: onSuccess,
                onFail: onFail
            })
        }
        catch (e) {
            console.error(e);
        }
    }

    async function fetchAndParseAllPages(requestBundles: Promise<Response>[][]): Promise<Movie[]> {
        const movies: Movie[] = [];

        const validateResponse = (response: Response) => {
            if (!response.ok) {
                //TODO: Handle not ok response
                console.error("Response not ok", response);
                return;
            }
            response.json().then(validateResult);
        }
        const validateResult = (data: unknown) => {
            validateOMDbSearchResponse(data, {
                onSuccess: sortAndPush,
                onFail: logError
            })
        }
        const sortAndPush = (result: OMDbSearchSuccess) => {
            //sort
            movies.push(...result.Search);
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