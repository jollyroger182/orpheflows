import { type StepExecutionContext } from '..'

import channels from './channels'
import form from './form'
import legacy from './legacy'
import lists from './lists'
import logic from './logic'
import math from './math'
import messaging from './messaging'
import text from './text'
import trigger from './trigger'
import users from './users'
import variables from './variables'

export const stepHandlers: Record<string, (context: StepExecutionContext) => Promise<unknown>> = {
	...trigger,
	...messaging,
	...form,
	...channels,
	...users,

	...logic,
	...math,
	...text,
	...lists,
	...variables,

	...legacy
}
