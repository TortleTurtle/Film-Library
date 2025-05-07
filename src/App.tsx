import {useState} from "react";
import {
    buildRequestPagesBundles,
    createSearchQuery,
    isOMDbSearchFail,
    isOMDbSearchResponse,
    Movie,
    OMDbSearchFail,
    OMDbSearchParams,
    OMDbSearchSuccess, SortCategory, SortDirection, sortFunctions,
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

    //Searching
    async function search(searchParams : OMDbSearchParams) {
        try {
            //TODO: Add response validation
            const res = await fetch(createSearchQuery(searchParams));
            const data : unknown = await res.json();

            const onFail = (data: OMDbSearchFail) => {
                console.log("Search failed:", data.Error);
            }
            const onSuccess = (data: OMDbSearchSuccess) => {
                if (searchParams.sortCategory) {
                    advancedSearch(data, searchParams, searchParams.sortCategory, searchParams.sortDirection);
                } else {
                    setSearchResult({
                        movies: data.Search,
                        totalResults: Number(data.totalResults),
                        searchParams: {...searchParams},
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
    async function advancedSearch(firstResult : OMDbSearchSuccess, searchParams : OMDbSearchParams, sortCategory: SortCategory, sortDirection: SortDirection) {
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
            searchResult.movies.sort(sortFunctions[sortCategory][sortDirection]);
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

    //Pagination
    const setPage = (page : number) : void => {
        if (searchResult!.searchParams.sortCategory) {
            setSearchResult(prevState => {
                return {
                    ...prevState!,
                    searchParams: {
                        ...prevState!.searchParams,
                        page: page
                    }
                }
            })
        } else {
            search({...searchResult!.searchParams, page: page})
        }
    }
    const getMoviesToDisplay = () => {
        if (!searchResult) return [];

        if (searchResult.movies.length > 10) {
            const pageNumber = searchResult.searchParams.page ? searchResult.searchParams.page : 1;
            let end = pageNumber * 10 - 1;
            if (end > searchResult.movies.length) end = searchResult.movies.length - 1;
            const start = pageNumber > 1 ? end - 10 : 1;
            return searchResult.movies.slice(start, end);
        }

        return searchResult.movies;
    }
    const moviesToDisplay = getMoviesToDisplay();

  return (<main>
      <h1>Search Movie</h1>
      {searchResult ?
          <SearchBar search={search}
                     getPage={setPage}
                     totalResults={searchResult.totalResults}/>
          :
          <SearchBar search={search} getPage={setPage}/>
      }
      {moviesToDisplay.length > 0 && <MovieList movieList={moviesToDisplay}/>}
  </main>)
}

export default App