import { isCodedError } from '@slack/bolt'
import { ErrorCode, type WebAPIPlatformError } from '@slack/web-api'

export function isSlackPlatformError(e: unknown, error: string) {
	try {
		return (
			isCodedError(e) &&
			e.code === ErrorCode.PlatformError &&
			(e as WebAPIPlatformError).data.error === error
		)
	} catch {
		return false
	}
}

// this function is written by ai
export function isPrime(n: bigint) {
	const k = 10
	if (n < 2n) return false
	if (n === 2n || n === 3n) return true
	if (n % 2n === 0n) return false

	// Write n-1 as 2^r * d
	let r = 0,
		d = n - 1n
	n = BigInt(n)
	d = n - 1n
	while (d % 2n === 0n) {
		d /= 2n
		r++
	}

	const witnesses = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n]

	function modPow(base: bigint, exp: bigint, mod: bigint) {
		let result = 1n
		base %= mod
		while (exp > 0n) {
			if (exp % 2n === 1n) result = (result * base) % mod
			exp /= 2n
			base = (base * base) % mod
		}
		return result
	}

	outer: for (let i = 0; i < Math.min(k, witnesses.length); i++) {
		const a = witnesses[i]
		if (a >= n) continue
		let x = modPow(a, d, n)
		if (x === 1n || x === n - 1n) continue
		for (let j = 0; j < r - 1; j++) {
			x = (x * x) % n
			if (x === n - 1n) continue outer
		}
		return false
	}
	return true
}
