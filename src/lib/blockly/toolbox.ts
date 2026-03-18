import * as Blockly from 'blockly'

const toolbox: Blockly.utils.toolbox.ToolboxInfo = {
	kind: 'categoryToolbox',
	contents: [
		{
			kind: 'category',
			name: 'Trigger',
			contents: [
				{ kind: 'block', type: 'trigger', extraState: { trigger: 'MANUAL' } },
				{ kind: 'block', type: 'trigger', extraState: { trigger: 'REACTION' } },
				{ kind: 'block', type: 'trigger', extraState: { trigger: 'MESSAGE' } },
				{ kind: 'block', type: 'trigger', extraState: { trigger: 'DM' } },
				{ kind: 'block', type: 'trigger', extraState: { trigger: 'BUTTON' } },
				{ kind: 'block', type: 'trigger', extraState: { trigger: 'SLASH' } },
				{ kind: 'block', type: 'trigger_user' },
				{ kind: 'block', type: 'trigger_trigger_id' },
				{ kind: 'block', type: 'trigger_message' },
				{ kind: 'block', type: 'trigger_data' }
			],
			categorystyle: 'trigger_category'
		},
		{
			kind: 'category',
			name: 'Messaging',
			contents: [
				{
					kind: 'block',
					type: 'messaging_send_v1',
					inputs: {
						TEXT: { shadow: { type: 'text_embed', fields: { TEXT: 'Hello World' } } },
						COMPS: {
							block: { type: 'lists_create_with', extraState: { itemCount: 0 } }
						}
					}
				},
				{
					kind: 'block',
					type: 'messaging_action_button',
					inputs: {
						TEXT: { shadow: { type: 'text_embed', fields: { TEXT: 'OK' } } },
						ACTIONID: { shadow: { type: 'text_embed', fields: { TEXT: 'confirm_action' } } },
						VALUE: { shadow: { type: 'text_embed', fields: { TEXT: 'additional state' } } }
					}
				},
				{
					kind: 'block',
					type: 'messaging_send_text',
					inputs: {
						CHANNEL: {
							shadow: {
								type: 'channel_from_id',
								inputs: { ID: { shadow: { type: 'text_embed', fields: { TEXT: 'C' } } } }
							}
						},
						TEXT: { shadow: { type: 'text_embed', fields: { TEXT: 'Hello World' } } }
					}
				},
				{
					kind: 'block',
					type: 'messaging_reply',
					inputs: {
						THREAD: { shadow: { type: 'trigger_message' } },
						TEXT: { shadow: { type: 'text_embed', fields: { TEXT: 'Hello World' } } }
					}
				},
				{
					kind: 'block',
					type: 'messaging_add_reaction',
					inputs: { EMOJI: { shadow: { type: 'text_embed', fields: { TEXT: 'yay' } } } }
				},
				{ kind: 'block', type: 'messaging_get_text' },
				{ kind: 'block', type: 'message_from_ts' },
				{ kind: 'block', type: 'message_to_channel' },
				{ kind: 'block', type: 'message_to_ts' }
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
						TITLE: { shadow: { type: 'text_embed', fields: { TEXT: 'Join my channel' } } },
						TEXT: {
							shadow: {
								type: 'text_embed',
								fields: { TEXT: 'Please answer the following questions!' }
							}
						},
						QUESTIONS: {
							block: {
								type: 'lists_create_with',
								inline: true,
								extraState: { itemCount: 1 },
								inputs: {
									ADD0: {
										block: { type: 'text_embed', fields: { TEXT: 'Why would you like to join?' } }
									}
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
					inputs: { ID: { shadow: { type: 'text_embed', fields: { TEXT: 'C' } } } }
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
					inputs: { ID: { shadow: { type: 'text_embed', fields: { TEXT: 'U' } } } }
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
				{ kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
				{ kind: 'block', type: 'controls_if', extraState: { elseIfCount: 1, hasElse: true } },
				{ kind: 'block', type: 'ignore_output' }
			],
			categorystyle: 'logic_category'
		},
		{
			kind: 'category',
			name: 'Primitives',
			contents: [
				{ kind: 'block', type: 'text' },
				{ kind: 'block', type: 'text_join', inline: true },
				{ kind: 'block', type: 'logic_boolean' },
				{ kind: 'block', type: 'math_number' },
				{ kind: 'block', type: 'lists_create_with', inline: true, extraState: { itemCount: 0 } },
				{ kind: 'block', type: 'lists_create_with', inline: true },
				{ kind: 'block', type: 'logic_compare' },
				{ kind: 'block', type: 'text_length2' },
				{ kind: 'block', type: 'text_indexOf2' },
				{
					kind: 'block',
					type: 'lists_custom_getindex',
					inputs: { INDEX: { shadow: { type: 'math_number' } } }
				},
				{ kind: 'block', type: 'convert_float' },
				{ kind: 'block', type: 'convert_int' },
				{ kind: 'block', type: 'math_round' }
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
