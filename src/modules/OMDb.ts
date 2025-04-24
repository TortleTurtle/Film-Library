export const MEDIA_TYPES = ["movie", "series", "episode"] as const;
export type MediaType = typeof MEDIA_TYPES[number];
export function isValidMediaType(value: unknown): value is MediaType {
    return MEDIA_TYPES.includes(value as MediaType);
}

export interface Movie {
    Title: string,
    Type: MediaType, //abstract this out
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

//For building search query
export interface OMDbSearchParams {
    title: string,
    mediaType?: MediaType // Literal union type, must use literal inference.
    year?: string
    page?: number
}

//responses
export type OMDbSearchResponse = OMBbSearchSuccess | OMDbSearchFail;

//TODO: Search can be multiple modules see Media Types.
export interface OMBbSearchSuccess {
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
export function isOMDbSearchSuccess(searchResponse: OMDbSearchResponse): searchResponse is OMBbSearchSuccess {
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
        onSuccess: (value : OMBbSearchSuccess) => R,
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