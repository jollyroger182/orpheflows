import * as Blockly from 'blockly'
import data from './blocks.json'

type TriggerBlock = Blockly.Block & TriggerMixin
interface TriggerMixin extends TriggerMixinType {
	trigger: string
}
type TriggerMixinType = typeof TRIGGER

const TRIGGER = {
	init: function (this: TriggerBlock) {
		this.setStyle('trigger_blocks')
		this.setNextStatement(true, null)

		this.appendDummyInput('DUMMY')
			.appendField('when')
			.appendField(
				new Blockly.FieldDropdown(
					[
						['workflow is executed in slack', 'MANUAL'],
						['workflow is executed on website', 'WEBSITE'],
						['workflow is executed via API', 'API'],
						['workflow is executed in editor', 'EDITOR'],
						['reaction is added', 'REACTION'],
						['message is received', 'MESSAGE'],
						['message is received in DM', 'DM'],
						['button is clicked', 'BUTTON'],
						['slash command is run', 'SLASH']
					],
					this.onDropdownChange_.bind(this)
				),
				'TRIGGER'
			)

		this.updateShape_('MANUAL')
	},
	onDropdownChange_: function (this: TriggerBlock, newValue: string) {
		this.updateShape_(newValue)
		return newValue
	},
	updateShape_: function (this: TriggerBlock, value: string) {
		if (this.getInput('DYNAMIC')) {
			this.removeInput('DYNAMIC')
		}

		if (
			value === 'MANUAL' ||
			value === 'WEBSITE' ||
			value === 'API' ||
			value === 'EDITOR' ||
			value === 'DM'
		)
			return

		const input = this.appendDummyInput('DYNAMIC')

		if (value === 'REACTION') {
			input
				.appendField('in channel ID')
				.appendField(new Blockly.FieldTextInput('C'), 'CHANNEL')
				.appendField('emoji name')
				.appendField(new Blockly.FieldTextInput('yay'), 'EMOJI')
		} else if (value === 'MESSAGE') {
			input.appendField('in channel ID').appendField(new Blockly.FieldTextInput('C'), 'CHANNEL')
		} else if (value === 'BUTTON') {
			input
				.appendField('with action ID')
				.appendField(new Blockly.FieldTextInput('confirm_action'), 'ACTIONID')
		} else if (value === 'SLASH') {
			input
				.appendField('with name /')
				.appendField(new Blockly.FieldTextInput('join_my_channel'), 'NAME')
		}
	},
	saveExtraState: function (this: TriggerBlock) {
		return { trigger: this.getFieldValue('TRIGGER') }
	},
	loadExtraState: function (this: TriggerBlock, state: { trigger: string }) {
		this.setFieldValue(state.trigger || 'MANUAL', 'TRIGGER')
		this.updateShape_(state.trigger || 'MANUAL')
	}
}

function generateSendMessageBlock(withOutput: boolean) {
	type SendMessageBlock = Blockly.Block & SendMessageMixin
	interface SendMessageMixin extends SendMessageMixinType {
		mode: 'CHANNEL' | 'THREAD' | 'USER'
		ephemeral: boolean
	}
	type SendMessageMixinType = typeof SEND_MESSAGE

	const SEND_MESSAGE = {
		init: function (this: SendMessageBlock) {
			this.jsonInit({
				type: 'messaging_send_v1',
				tooltip: 'Returns the message sent.',
				message0: `send message in %1 %2 with text %3 actions %4${withOutput ? '' : ' ephemeral %5 %6'}`,
				args0: [
					{
						type: 'field_dropdown',
						name: 'MODE',
						options: [
							['channel', 'CHANNEL'],
							['thread', 'THREAD'],
							['user', 'USER']
						]
					},
					{ type: 'input_value', name: 'LOC', align: 'RIGHT', check: 'Channel' },
					{ type: 'input_value', name: 'TEXT', align: 'RIGHT', check: 'String' },
					{ type: 'input_value', name: 'COMPS', align: 'RIGHT', check: 'Array' },
					...(withOutput
						? []
						: [
								{ type: 'field_checkbox', name: 'EPHEMERAL', checked: 'FALSE' },
								{ type: 'input_dummy', name: 'USER', align: 'RIGHT' }
							])
				],
				output: withOutput ? 'Message' : undefined,
				previousStatement: withOutput ? undefined : null,
				nextStatement: withOutput ? undefined : null,
				style: 'messaging_blocks',
				inputsInline: false
			})

			this.setStyle('messaging_blocks')

			this.getField('MODE')?.setValidator(this.onDropdownChange_.bind(this))
			this.getField('EPHEMERAL')?.setValidator(this.onEphemeralChange_.bind(this))

			this.mode = this.mode || 'CHANNEL'
			this.ephemeral = this.ephemeral || false
		},
		onDropdownChange_: function (this: SendMessageBlock, newValue: 'CHANNEL' | 'THREAD' | 'USER') {
			this.updateShape_()
			return newValue
		},
		onEphemeralChange_: function (this: SendMessageBlock, newValue: 'FALSE' | 'TRUE' | boolean) {
			this.updateShape_()
			return newValue
		},
		updateShape_: function (this: SendMessageBlock, immediate = false) {
			const execute = () => {
				this.mode = this.getFieldValue('MODE')
				this.getInput('LOC')?.setCheck(
					{ CHANNEL: 'Channel', THREAD: 'Message', USER: 'User' }[this.mode]
				)
				if (!withOutput) {
					const ephemeral = this.getFieldValue('EPHEMERAL') === 'TRUE'
					if (this.ephemeral !== ephemeral) {
						this.removeInput('USER', true)
						if (ephemeral) {
							this.appendValueInput('USER')
								.setAlign(Blockly.inputs.Align.RIGHT)
								.setCheck('User')
								.appendField('ephemeral')
								.appendField(
									new Blockly.FieldCheckbox('TRUE', this.onEphemeralChange_.bind(this)),
									'EPHEMERAL'
								)
								.appendField('to user')
						} else {
							this.appendDummyInput('USER')
								.setAlign(Blockly.inputs.Align.RIGHT)
								.appendField('ephemeral')
								.appendField(
									new Blockly.FieldCheckbox('FALSE', this.onEphemeralChange_.bind(this)),
									'EPHEMERAL'
								)
						}
						this.ephemeral = ephemeral
					}
				}
			}
			if (immediate) execute()
			else setTimeout(execute, 0)
		},
		saveExtraState: function (this: SendMessageBlock) {
			return { mode: this.mode, ephemeral: this.ephemeral }
		},
		loadExtraState: function (
			this: SendMessageBlock,
			state: { mode: 'CHANNEL' | 'THREAD' | 'USER'; ephemeral: boolean }
		) {
			this.setFieldValue(state.mode || 'CHANNEL', 'MODE')
			if (!withOutput) this.setFieldValue(state.ephemeral || false, 'EPHEMERAL')
			this.updateShape_(true)
		}
	}
	return SEND_MESSAGE
}

const SEND_MESSAGE = generateSendMessageBlock(true)
const SEND_MESSAGE_STMT = generateSendMessageBlock(false)

export const blocks = {
	...Blockly.common.createBlockDefinitionsFromJsonArray(data),
	trigger: TRIGGER,
	messaging_send_v1: SEND_MESSAGE,
	messaging_send_v1_stmt: SEND_MESSAGE_STMT
}
