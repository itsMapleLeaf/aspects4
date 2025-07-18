/// <reference types="vite/client" />
/// <reference types="@total-typescript/ts-reset" />

import "react"
declare module "react" {
	export function useActionState<Input, Result>(
		action: (state: Awaited<Result> | undefined, input: Input) => Result,
	): [
		state: Awaited<Result> | undefined,
		dispatch: (input: Input) => void,
		isPending: boolean,
	]

	export function createContext<T>(): Context<T | undefined>
}
