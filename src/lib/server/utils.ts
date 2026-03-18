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
