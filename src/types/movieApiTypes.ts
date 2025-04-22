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
export interface MovieSearchParams {
    title: string,
    mediaType?: MediaType // Literal union type, must use literal inference.
    year?: string
    page?: number
}

//responses
export type MovieSearchResponse = MovieSearchResponseSuccess | MovieSearchResponseFail;

//TODO: Search can be multiple types see Media Types.
export interface MovieSearchResponseSuccess {
    Response: "True",
    Search: Movie[],
    totalResults: string
}
export interface MovieSearchResponseFail {
    Response: "False",
    Error: string,
}
//Holy shit narrowing wtf.
export function isMovieSearchResponse(res: unknown): res is MovieSearchResponse {
    return typeof res === "object" && res !== null && "Response" in res && (res.Response === "True" || res.Response === "False");
}
//good enough for now could create something to check if array contains objects that are movies.
export function isMovieSearchResponseSuccess(searchResponse: MovieSearchResponse): searchResponse is MovieSearchResponseSuccess {
    return searchResponse.Response === "True" &&
        "Search" in searchResponse &&
        "totalResults" in searchResponse &&
        Array.isArray(searchResponse.Search);
}
export function isMovieSearchResponseFail(searchResponse: MovieSearchResponse): searchResponse is MovieSearchResponseFail {
    return searchResponse.Response === "False" &&
        "Error" in searchResponse &&
        typeof searchResponse.Error === "string";
}