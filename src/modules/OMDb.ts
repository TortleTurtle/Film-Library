export const MEDIA_TYPES = ["movie", "series", "episode"] as const;
export type MediaType = typeof MEDIA_TYPES[number];
export function isMediaType(value: unknown): value is MediaType {
    return MEDIA_TYPES.includes(value as MediaType);
}

//TODO: Add Series and Episode
export interface Movie {
    Title: string,
    Type: MediaType,
    Poster: string,
    Year: string,
    imdbID: string
}
export interface MovieDetail extends Movie {
    Rated: string,
    Genres: string[],
    Director: string,
    Writer: string,
    Actors: string[],
    Rating: number,
}

export const sortFunctions = {
    title: {
        ascending: function (a: Movie, b: Movie){
            const titleA = a.Title.toUpperCase();
            const titleB = b.Title.toUpperCase();
            if (titleA < titleB) return -1;
            if (titleA > titleB) return 1;
            return 0;
        },
        descending: function (a: Movie, b: Movie){
            const titleA = a.Title.toUpperCase();
            const titleB = b.Title.toUpperCase();
            if (titleA > titleB) return -1;
            if (titleA < titleB) return 1;
            return 0;
        }
    },
    year: {
        ascending: function (a: Movie, b: Movie){
            return Number(a.Year) - Number(b.Year);
        },
        descending: function (a: Movie, b: Movie){
            return Number(b.Year) - Number(a.Year);
        }
    }
} as const;

export type SortCategory = keyof typeof sortFunctions;
export const SORT_CATEGORIES = Object.keys(sortFunctions) as SortCategory[];
export function isSortCategory(value: string): value is SortCategory {
    return SORT_CATEGORIES.includes(value as SortCategory);
}
export const SORT_DIRECTIONS = ["ascending", "descending"] as const;
export type SortDirection = typeof SORT_DIRECTIONS[number];
export function isSortDirection(value: string): value is SortDirection {
    return SORT_DIRECTIONS.includes(value as SortDirection);
}

//For building search query
export interface OMDbSearchParams {
    title: string,
    mediaType?: MediaType,
    year?: string,
    page?: number,
    sortCategory?: SortCategory,
    sortDirection: SortDirection,
}

//responses
export type OMDbSearchResponse = OMDbSearchSuccess | OMDbSearchFail;

export interface OMDbSearchSuccess {
    Response: "True",
    Search: Movie[],
    totalResults: string
}
export interface OMDbSearchFail {
    Response: "False",
    Error: string,
}
//Holy shit narrowing wtf.
export function isOMDbSearchResponse(res: unknown): res is OMDbSearchResponse {
    return typeof res === "object" && res !== null && "Response" in res && (res.Response === "True" || res.Response === "False");
}
//good enough for now could create something to check if array contains objects that are movies.
export function isOMDbSearchSuccess(searchResponse: OMDbSearchResponse): searchResponse is OMDbSearchSuccess {
    return searchResponse.Response === "True" &&
        "Search" in searchResponse &&
        "totalResults" in searchResponse &&
        Array.isArray(searchResponse.Search);
}
export function isOMDbSearchFail(searchResponse: OMDbSearchResponse): searchResponse is OMDbSearchFail {
    return searchResponse.Response === "False" &&
        "Error" in searchResponse &&
        typeof searchResponse.Error === "string";
}
export function validateOMDbSearchResponse<R>(
    data: unknown,
    handlers: {
        onSuccess: (value: OMDbSearchSuccess) => R,
        onFail: (value : OMDbSearchFail) => R
        onInvalid?: (data: unknown) => R,
}) : R | void {
    if (!isOMDbSearchResponse(data)) {
        if (handlers.onInvalid) return handlers.onInvalid(data);
        return defaultOnInvalid(data);
    } else if (isOMDbSearchFail(data)) {
        console.error(data.Error);
        return handlers.onFail(data);
    } else if (isOMDbSearchSuccess(data)) {
        return handlers.onSuccess(data);
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const neverData : never = data;
        return defaultOnInvalid(data);
    }
}
const defaultOnInvalid = (data: unknown) => {
    console.error("Unexpected OMDb response", data);
}

export function createSearchQuery(searchParams: OMDbSearchParams) {
    const url = new URL('https://www.omdbapi.com/');
    url.searchParams.set('apikey', import.meta.env.VITE_OMDB_API_KEY);
    url.searchParams.set("s", searchParams.title);
    if (searchParams.mediaType) url.searchParams.set("type", searchParams.mediaType);
    if (searchParams.year) url.searchParams.set("y", searchParams.year.toString());
    if (searchParams.page) url.searchParams.set("page", searchParams.page.toString());
    return url.toString();
}

export function buildRequestPagesBundles(searchParams: OMDbSearchParams, amountOfPages: number) {
    //Limit requests if we are developing.
    const maxPages = import.meta.env.MODE === "development" && amountOfPages > 10 ? 10 : amountOfPages;

    const bundles: Promise<Response>[][] = [[]];
    //starting at 2 because we already have the first page
    const bundleIndex = bundles.length > 0 ? bundles.length - 1 : 0;
    for (let pageNumber = 2; pageNumber <= maxPages; pageNumber++) {
        if (pageNumber % 5 === 0) bundles.push([]);
        bundles[bundleIndex].push(
            fetch(createSearchQuery({...searchParams, page: pageNumber}))
        )
    }
    return bundles;
}