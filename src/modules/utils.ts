import {OMDbSearchParams} from "./OMDb.ts";

export function createSearchQuery(searchParams : OMDbSearchParams) {
    const url = new URL('https://www.omdbapi.com/');
    url.searchParams.set('apikey', import.meta.env.VITE_OMDB_API_KEY);
    // Not very dry. Good enough for now.
    url.searchParams.set("s", searchParams.title);
    if (searchParams.mediaType) url.searchParams.set("type", searchParams.mediaType);
    if (searchParams.year) url.searchParams.set("y", searchParams.year.toString());
    if (searchParams.page) url.searchParams.set("page", searchParams.page.toString());
    return url.toString();
}
export function buildRequestPagesBundles(searchParams: OMDbSearchParams, amountOfPages: number){
    //Limit requests if we are developing.
    const maxPages = import.meta.env.MODE === "development" && amountOfPages > 10 ? 10 : amountOfPages;

    const bundles: Promise<Response>[][] = [];
    //starting at 2 because we already have the first page
    for (let pageNumber = 2; pageNumber <= maxPages; pageNumber++) {
        if (pageNumber % 5 === 0) bundles.push([]);
        bundles[bundles.length - 1].push(
            fetch(createSearchQuery({...searchParams, page: pageNumber}))
        )
    }
    return bundles;
}

export function matchSettled<T,R>(
    promise: PromiseSettledResult<T>,
    handlers: {
        onFulfilled: (value: T ) => R,
        onRejected: (reason: string) => R,
    }) : R {
    if (promise.status === "rejected") {
        return handlers.onRejected(promise.reason)
    } else {
        return handlers.onFulfilled(promise.value);
    }
}