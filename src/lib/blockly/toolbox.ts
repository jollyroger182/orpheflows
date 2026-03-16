import * as Blockly from 'blockly'

const toolbox: Blockly.utils.toolbox.ToolboxInfo = {
	kind: 'categoryToolbox',
	contents: [
		{
			kind: 'category',
			name: 'Trigger',
			contents: [{ kind: 'block', type: 'trigger_user' }],
			categorystyle: 'trigger_category'
		},
		{
			kind: 'category',
			name: 'Messaging',
			contents: [
				{
					kind: 'block',
					type: 'messaging_send_text',
					inputs: {
						CHANNEL: {
							shadow: {
								type: 'channel_from_id',
								inputs: { ID: { shadow: { type: 'text', fields: { TEXT: 'C' } } } }
							}
						},
						TEXT: { shadow: { type: 'text', fields: { TEXT: 'Hello World' } } }
					}
				}
			],
			categorystyle: 'messaging_category'
		},
		{
			kind: 'category',
			name: 'Channels',
			contents: [
				{
					kind: 'block',
					type: 'channel_from_id',
					inputs: { ID: { shadow: { type: 'text', fields: { TEXT: 'C' } } } }
				}
			],
			categorystyle: 'channel_category'
		},
		{
			kind: 'category',
			name: 'Users',
			contents: [
				{
					kind: 'block',
					type: 'user_from_id',
					inputs: { ID: { shadow: { type: 'text', fields: { TEXT: 'U' } } } }
				},
				{ kind: 'block', type: 'user_to_id' }
			],
			categorystyle: 'user_category'
		},
		{
			kind: 'category',
			name: 'Control',
			contents: [
				{ kind: 'block', type: 'controls_if' },
				{ kind: 'block', type: 'ignore_output' }
			],
			categorystyle: 'logic_category'
		},
		{
			kind: 'category',
			name: 'Primitives',
			contents: [
				{ kind: 'block', type: 'text' },
				{ kind: 'block', type: 'text_join' },
				{ kind: 'block', type: 'logic_boolean' },
				{ kind: 'block', type: 'math_number' },
				{ kind: 'block', type: 'logic_compare' }
			],
			categorystyle: 'text_category'
		},
		{
			kind: 'category',
			name: 'Variables',
			custom: 'VARIABLE',
			categorystyle: 'variable_category'
		}
	]
}
export default toolbox
