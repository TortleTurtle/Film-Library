import {useState} from "react";
import {
    isOMDbSearchResponse,
    isOMDbSearchFail,
    isOMDbSearchSuccess,
    Movie,
    OMDbSearchParams, OMDbSearchFail, OMBbSearchSuccess, validateOMDbSearchResponse
} from "./modules/OMDb.ts";
import SearchBar from "./components/SearchBar.tsx";
import MovieList from "./components/MovieList.tsx";
import {buildRequestPagesBundles, createSearchQuery, matchSettled} from "./modules/utils.ts";

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
            const onSuccess = (data: OMBbSearchSuccess)=> {
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
            const onSuccess = async (data: OMBbSearchSuccess)=> {
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
        for (const bundle of requestBundles){
            const settledPromises = await Promise.allSettled(bundle);
            const jsonPromises : Promise<unknown>[] = [];

            //validate responses
            for (const promise of settledPromises){
                const onFulfilled = (response: Response) => {
                    if (response.ok) jsonPromises.push(response.json());
                    //TODO: Handle not ok response
                    console.error("Response not ok", response);
                }
                const onRejected = (reason: string) => {
                    console.error(`Fetch promise rejected: ${reason}`);
                }

                matchSettled(promise, {
                    onFulfilled: onFulfilled,
                    onRejected: onRejected
                });
            }

            //parse json
            const settledJsonPromises = await Promise.allSettled(jsonPromises);
            for (const promise of settledJsonPromises){

                const onFulfilled = (data: unknown) => {
                    const onFail = async (data: OMDbSearchFail) => {
                        //TODO: Handle error, retry?
                        console.error("Page Search failed:", data.Error);
                    }
                    const onSuccess = ()=> {
                        //TODO: validate OMDbResponse.
                        //Parse
                    }
                }
                const onRejected = (reason: string) => {
                    console.error(`JSON promise rejected: ${reason}`);
                }

                matchSettled(promise, {
                    onFulfilled: onFulfilled,
                    onRejected: onRejected
                });

                //TODO: Guards for MovieSearchResponses.
                const data = (promise as PromiseFulfilledResult<unknown>).value
                if (!isOMDbSearchResponse(data)) {
                    //TODO: retry
                } else if (isOMDbSearchFail(data)){
                    //TODO: retry
                } else if (isOMDbSearchSuccess(data)) {

                } else {
                    console.error("unknown MovieSearchResponse", promise);
                }
            }
        }

        //concat all movies together. We could do this async as well.
        let movies: Movie[] = [];
        for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
            const data : unknown = await results[resultIndex].json();

            /* TODO: Retry failed responses
            *   - validate response status (200)
            *   - retry if 500 code.
            *   - if 403 or 404 code show error message.
             */
            if (!isOMDbSearchResponse(data)) {
                throw new Error(`Response for page ${resultIndex + 1} does not match type`);
            } else if (isOMDbSearchFail(data)) {

                throw new Error(`Page ${resultIndex + 1} failed: ${data.Error}`);
            }
            else if (isOMDbSearchSuccess(data)) {
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