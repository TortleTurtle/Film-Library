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