# Movie Library
Personal React + TypeScript project. Goal of this project is to:
- Type props.
- Learn how to type requests from an API.
- How to assert and narrow types.
- asynchronous programming.

## Features
- [x] Search movies using [OMDb](http://www.omdbapi.com/)
- [x] OMDb Pagination
- [ ] Filter & sort results
  - [x] fetch all results async. 1 response has 10 results.
  - [ ] Sort algorithm.
- [ ] Client side pagination (in case of advanced search)
- [ ] Retry failed fetches
  - [ ] fetchAndParseAllPages track failed attempts.
  - [ ] Track retries per fetch.

### Bonus
- [ ] caching or localStorage?

## Challenges I faced
### Asserting & validating API responses
As TypeScript only check compile-time safety it is not possible to assign type on runtime.
To check if a response is correct very strict narrowing is necessary.
In this case I used a union type together with predicates.
See `OMDbSearchResponse`, `OMDbSearchResponseSucces` and `OMDbSearchResponseFail` in `OMDb.ts`.

The reason I used a union type for `OMDbSearchResponse` instead of an interface and have the others extend that interface is that now I can use the `never` type to perform an exhaustive check.
If `OMDbSearchResponse` was an interface I would get the error that this is not assignable to `never`, making it necessary to perform a redundant check if it was a `OMDbSearchResponse`.
```ts
if (isOMDbSearchResponseSuccess(data)) {
  const result : SearchResult = {
    movies: data.Search,
    totalResults: Number(data.totalResults),
    searchParams: {...searchParams} // destructring just to be sure.
  }
  setSearchResult(result);
} else if (isOMDbSearchResponseFail(data)) {
  console.error(data.Error);
} else {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exhaustiveCheck : never = data;
}
```
Now if I add a new response type to `OMDbSearchResponse`. TypeScript will let me know I am not handling all options.

### Performing multiple request asynchronously
The OMDb api allows for searching based on a few parameters such as title, media type or year.
However, a use may want to have more options for searching, filtering and sorting. As OMDb does not implement I need create this functionality.

Step 1 - calculating how many pages I need to fetch; OMDb only return 10 results per response and OMDb does not implement an endpoint to fetch all results.
Thus, I need to fetch all pages myself to get all the results. I perform an initial request to gain the necessary information: 
```ts
  const response = await fetch(createSearchQuery(searchParams));
  const data : unknown = await response.json();
  //validate data...
  const amountOfPages = Math.ceil(Number(data.totalResults) / 10);
```
Step 2 - creating bundles; 
The first solution that came to mind was to create a loop that fetches each page, but if we await each request it could take seconds to fetch every single page.
Asynchronous function are non-blocking, meaning I am able to perform multiple request at the same time (kind of).
However performing all requests at the same time may be interpreted as a DDOS attack.
Thus, requests should be bundled and bundles will be fetched one after another.
```ts
export function buildRequestPagesBundles(searchParams: OMDbSearchParams, amountOfPages: number) {
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
```
Step 3 - validating & parsing results;
My first working version, see [here](https://github.com/TortleTurtle/Film-Library/blob/6eb9cbac820e883d01f9c09fe0f801b9e81fc85e/src/App.tsx#L91),
worked but had some problems:
1. Blocking the fetching of new bundles.
   - On [line 117](https://github.com/TortleTurtle/Film-Library/blob/6eb9cbac820e883d01f9c09fe0f801b9e81fc85e/src/App.tsx#L119) I was blocking fetching new bundles by awaiting the parsing of json data.
2. Readability & DRY
   - Validating promises, responses en results created an unreadable mess.

I solved the first problem by passing the promise to an async function and awaiting there.
```ts
const validateResponse = (response: Response) => {
    //validation logic
    validateResult(response.json());
}
const validateResult = async (jsonPromise: Promise<unknown>) => {
    const data = await jsonPromise;
    validateOMDbSearchResponse(data, {
        onSuccess: sortAndPush,
        onFail: logError
    })
}
```
Problem 2 was caused by TypeScript in a way as it forces you to create a lot more boilerplate for type checking.
By creating helper functions such as validateOMDbSearchResponse() I can easily perform type checking or narrowing without cluttering the screen.
```ts
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
        const neverData : never = data;
        return defaultOnInvalid(data);
    }
}
```
I also broke up the function in smaller scoped helper functions such as `sortAndPush` and `logError` making it more apparent what is happening when.