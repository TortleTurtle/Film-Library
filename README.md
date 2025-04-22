# Movie Library
Personal React + TypeScript project. Goal of this project is to:
- Type props.
- Learn how to type requests from an API.
- How to assert and narrow types.
- asynchronous programming.

## Features
- [x] Search movies using [OMDb](http://www.omdbapi.com/)
- [x] Pagination
- [ ] Filter & sort results
  - [ ] fetch all results async. 1 response has 10 results.
  - [ ] search & sort algorithm.

### Bonus
- [ ] caching or localStorage?

## Challenges I faced
### Asserting api responses
As TypeScript only check compile-time safety it is not possible to assign type on runtime.
To check if a response is correct very strict narrowing is necessary.
In this case I used a union type together with predictates.
See `MovieSearchResponse`, `MovieSearchResponseSucces` and `MovieSearchResponseFail` in `movieApiTypes.ts`.

The reason I used a union type for `MovieSearchResponse` instead of a interface and have the others extend that interface is that now I can use the `never` type to perform an exhaustive check.
If `MovieSearchResponse` was a valid stand alone object I would get the error that this is not assignable to `never`, making it neccesary to perform a redudant check if it was a `MovieSearchResponse`.
```ts
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exhaustiveCheck : never = data;
}
```
Now if I add a new response type to `MovieSearchResponse`. TypeScript will let me know I am not handling all options.