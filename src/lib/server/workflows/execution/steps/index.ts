import { type StepExecutionContext } from '..'

import channels from './channels'
import control from './control'
import dictionaries from './dictionaries'
import form from './form'
import integration from './integration'
import legacy from './legacy'
import lists from './lists'
import math from './math'
import messaging from './messaging'
import persistence from './persistence'
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
	...integration,

	...control,
	...math,
	...text,
	...lists,
	...dictionaries,
	...variables,
	...persistence,

	...legacy
}
