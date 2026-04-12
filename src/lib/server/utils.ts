import { isCodedError } from '@slack/bolt'
import {
	ErrorCode,
	type ActionsBlockElement,
	type KnownBlock,
	type WebAPIPlatformError
} from '@slack/web-api'
import type { StepExecutionContext } from './workflows/execution'

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

export async function generateStepBlocks({
	ctx,
	text,
	components: componentsStep
}: {
	ctx: StepExecutionContext
	text: string
	components: WorkflowStep
}): Promise<KnownBlock[]> {
	const components = JSON.parse(await ctx.evaluate(componentsStep as WorkflowStep)) as string[]

	const actionBlocks: KnownBlock[] = []
	if (components.length) {
		const actions: ActionsBlockElement[] = []
		for (const def of components) {
			const action = JSON.parse(def)
			if (action.type === 'button') {
				const style = action.style === 'NORMAL' ? undefined : action.style.toLowerCase()
				actions.push({
					type: 'button',
					text: { type: 'plain_text', text: action.text, emoji: true },
					action_id: action.action_id,
					value: action.value || undefined,
					style
				})
			}
		}
		actionBlocks.push({ type: 'actions', elements: actions })
	}

	return [{ type: 'section', text: { type: 'mrkdwn', text } }, ...actionBlocks]
}

export async function checkIdv(slackId: string) {
	const { result } = (await fetch(
		`https://auth.hackclub.com/api/external/check?slack_id=${slackId}`
	).then((r) => r.json())) as { result: string }
	return result === 'verified_eligible' || result === 'verified_but_over_18'
}

export function countSteps(code: WorkflowStep[]) {
	let count = 0
	for (const step of code) {
		count++
		for (const value of Object.values(step.params)) {
			if (value instanceof Array) {
				count += countSteps(value)
			}
		}
	}
	return count
}
