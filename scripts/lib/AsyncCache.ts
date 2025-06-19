type AsyncCacheFetcher<T, Args extends readonly unknown[]> = (
	key: string,
	...args: Args
) => Promise<T>

export class AsyncCache<T, Args extends readonly unknown[]> {
	#items = new Map<string, Promise<T>>()
	#fetcher: AsyncCacheFetcher<T, Args>

	constructor(fetch: AsyncCacheFetcher<T, Args>) {
		this.#fetcher = fetch
	}

	fetch(key: string, ...args: Args): Promise<T> {
		let result = this.#items.get(key)
		if (!result) {
			result = this.#fetcher(key, ...args)
			this.#items.set(key, result)
		}
		return result
	}
}
