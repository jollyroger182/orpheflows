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
						['workflow is executed', 'MANUAL'],
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

		if (value === 'MANUAL' || value === 'DM') return

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

type SendMessageBlock = Blockly.Block & SendMessageMixin
interface SendMessageMixin extends SendMessageMixinType {
	mode: 'CHANNEL' | 'THREAD'
}
type SendMessageMixinType = typeof SEND_MESSAGE

const SEND_MESSAGE = {
	init: function (this: SendMessageBlock) {
		this.jsonInit({
			type: 'messaging_send_v1',
			tooltip: 'Returns the message sent.',
			message0: 'send message in %1 %2 with text %3 actions %4',
			args0: [
				{
					type: 'field_dropdown',
					name: 'MODE',
					options: [
						['channel', 'CHANNEL'],
						['thread', 'THREAD']
					]
				},
				{
					type: 'input_value',
					name: 'LOC',
					align: 'RIGHT',
					check: 'Channel'
				},
				{
					type: 'input_value',
					name: 'TEXT',
					align: 'RIGHT',
					check: 'String'
				},
				{
					type: 'input_value',
					name: 'COMPS',
					align: 'RIGHT',
					check: 'Array'
				}
			],
			output: 'Message',
			style: 'messaging_blocks'
		})

		this.setStyle('messaging_blocks')

		this.getField('MODE')?.setValidator(this.onDropdownChange_.bind(this))

		this.mode = this.mode || 'CHANNEL'
	},
	onDropdownChange_: function (this: SendMessageBlock, newValue: 'CHANNEL' | 'THREAD') {
		this.mode = newValue
		this.updateShape_()
		return newValue
	},
	updateShape_: function (this: SendMessageBlock) {
		this.getInput('LOC')?.setCheck(this.mode === 'THREAD' ? 'Message' : 'Channel')
	},
	saveExtraState: function (this: SendMessageBlock) {
		return { mode: this.mode }
	},
	loadExtraState: function (this: SendMessageBlock, state: { mode: 'CHANNEL' | 'THREAD' }) {
		this.mode = state.mode || 'CHANNEL'
		this.updateShape_()
	}
}

export const blocks = {
	...Blockly.common.createBlockDefinitionsFromJsonArray(data),
	trigger: TRIGGER,
	messaging_send_v1: SEND_MESSAGE
}
