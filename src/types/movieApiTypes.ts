export const MEDIA_TYPES = ["movie", "series", "episode"] as const;
export type MediaType = typeof MEDIA_TYPES[number];

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
export function isValidMediaType(value: unknown): value is MediaType {
    return MEDIA_TYPES.includes(value as MediaType);
}

//responses
export type MovieSearchResponse = MovieSearchResponseSuccess | MovieSearchResponseError;

export interface MovieSearchResponseSuccess {
    Response: "True",
    Search: Movie[],
    totalResults: string
}
export interface MovieSearchResponseError {
    Response: "False",
    Error: string,
}