import * as Blockly from 'blockly'
import data from './blocks.json'

type TriggerBlock = Blockly.Block & TriggerMixin
interface TriggerMixin extends TriggerMixinType {
	trigger: string
}
type TriggerMixinType = typeof TRIGGER

const TRIGGER = {
	init: function (this: TriggerBlock) {
		this.setStyle('trigger')
		this.setNextStatement(true, null)

		this.appendDummyInput('DUMMY')
			.appendField('when')
			.appendField(
				new Blockly.FieldDropdown(
					[
						['workflow is executed', 'MANUAL'],
						['reaction is added', 'REACTION'],
						['message is received', 'MESSAGE'],
						['message is received in DM', 'DM']
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

export const blocks = {
	...Blockly.common.createBlockDefinitionsFromJsonArray(data),
	trigger: TRIGGER
}
