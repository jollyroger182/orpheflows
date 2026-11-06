import { browser } from '$app/environment'

export function persistedState<T extends string>(
	key: string,
	initial: T,
	isValid: (value: string) => value is T
) {
	let value = $state(initial)

	if (browser) {
		const stored = localStorage.getItem(key)

		if (stored && isValid(stored)) {
			value = stored
		}

		$effect(() => {
			localStorage.setItem(key, value)
		})
	}

	return {
		get value() {
			return value
		},
		set value(next: T) {
			value = next
		}
	}
}
