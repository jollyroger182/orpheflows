import * as Blockly from 'blockly'

const toolbox: Blockly.utils.toolbox.ToolboxInfo = {
	kind: 'categoryToolbox',
	contents: [
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
			name: 'Control',
			contents: [{ kind: 'block', type: 'controls_if' }],
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
				{
					kind: 'block',
					type: 'channel_from_id',
					inputs: { ID: { shadow: { type: 'text', fields: { TEXT: 'C' } } } }
				}
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
