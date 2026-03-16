import * as Blockly from 'blockly'

const toolbox: Blockly.utils.toolbox.ToolboxInfo = {
	kind: 'categoryToolbox',
	contents: [
		{
			kind: 'category',
			name: 'Trigger',
			contents: [
				{ kind: 'block', type: 'trigger_user' },
				{ kind: 'block', type: 'trigger_trigger_id' }
			],
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
			name: 'Form',
			contents: [
				{
					kind: 'block',
					type: 'form_present',
					inputs: {
						TITLE: { shadow: { type: 'text', fields: { TEXT: 'Join my channel' } } },
						TEXT: {
							shadow: { type: 'text', fields: { TEXT: 'Please answer the following questions!' } }
						},
						QUESTIONS: {
							block: {
								type: 'lists_create_with',
								inputs: {
									ADD0: { block: { type: 'text', fields: { TEXT: 'Why would you like to join?' } } }
								}
							}
						},
						TRIGGER_ID: { shadow: { type: 'trigger_trigger_id' } }
					}
				}
			],
			categorystyle: 'form_category'
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
				{ kind: 'block', type: 'lists_create_with' },
				{
					kind: 'block',
					type: 'lists_custom_getindex',
					inputs: { INDEX: { shadow: { type: 'math_number' } } }
				},
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
