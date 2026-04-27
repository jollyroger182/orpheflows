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
				{ kind: 'block', type: 'trigger_data' },
				{
					kind: 'block',
					type: 'trigger_respond',
					inputs: {
						TEXT: { shadow: { type: 'text', fields: { TEXT: 'Hello World' } } },
						COMPS: {
							block: { type: 'lists_create_with', extraState: { itemCount: 0 } }
						}
					}
				}
			],
			categorystyle: 'trigger_category'
		},
		{
			kind: 'category',
			name: 'Messaging',
			contents: [
				{ kind: 'block', type: 'message_from_ts' },
				{ kind: 'block', type: 'message_to_channel' },
				{ kind: 'block', type: 'message_to_ts' },
				{ kind: 'block', type: 'messaging_get_text' },
				{ kind: 'block', type: 'messaging_get_thread_ts' },
				{
					kind: 'block',
					type: 'messaging_send_v1',
					inputs: {
						TEXT: { shadow: { type: 'text', fields: { TEXT: 'Hello World' } } },
						COMPS: {
							block: { type: 'lists_create_with', extraState: { itemCount: 0 } }
						}
					}
				},
				{
					kind: 'block',
					type: 'messaging_send_v1_stmt',
					inputs: {
						TEXT: { shadow: { type: 'text', fields: { TEXT: 'Hello World' } } },
						COMPS: {
							block: { type: 'lists_create_with', extraState: { itemCount: 0 } }
						}
					}
				},
				{
					kind: 'block',
					type: 'messaging_action_button',
					inputs: {
						TEXT: { shadow: { type: 'text', fields: { TEXT: 'OK' } } },
						ACTIONID: { shadow: { type: 'text', fields: { TEXT: 'confirm_action' } } },
						VALUE: { shadow: { type: 'text', fields: { TEXT: 'additional state' } } }
					}
				},
				{
					kind: 'block',
					type: 'messaging_add_reaction',
					inputs: { EMOJI: { shadow: { type: 'text', fields: { TEXT: 'yay' } } } }
				},
				{
					kind: 'block',
					type: 'messaging_unreact',
					inputs: { EMOJI: { shadow: { type: 'text', fields: { TEXT: 'yay' } } } }
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
							shadow: {
								type: 'text',
								fields: { TEXT: 'Please answer the following questions!' }
							}
						},
						QUESTIONS: {
							block: {
								type: 'lists_create_with',
								extraState: { itemCount: 1 },
								inputs: {
									ADD0: {
										block: { type: 'text', fields: { TEXT: 'Why would you like to join?' } }
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
					inputs: { ID: { shadow: { type: 'text', fields: { TEXT: 'C' } } } }
				},
				{ kind: 'block', type: 'channel_to_id' },
				{
					kind: 'block',
					type: 'channel_create',
					inputs: { NAME: { shadow: { type: 'text', fields: { TEXT: 'my-channel' } } } }
				},
				{ kind: 'block', type: 'channel_invite' },
				{ kind: 'block', type: 'channel_archive' }
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
				{ kind: 'block', type: 'user_to_id' },
				{ kind: 'block', type: 'user_mention' }
			],
			categorystyle: 'user_category'
		},
		{
			kind: 'category',
			name: 'Integration',
			contents: [
				{
					kind: 'block',
					type: 'integration_request',
					inputs: {
						URL: { shadow: { type: 'text', fields: { TEXT: 'https://example.com' } } },
						BODY: { shadow: { type: 'text' } },
						HEADERS: { block: { type: 'lists_create_with', extraState: { itemCount: 0 } } }
					}
				}
			],
			categorystyle: 'integration_category'
		},

		{ kind: 'sep' },

		{
			kind: 'category',
			name: 'Control',
			contents: [
				{ kind: 'block', type: 'controls_if' },
				{ kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
				{ kind: 'block', type: 'controls_if', extraState: { elseIfCount: 1, hasElse: true } },
				{
					kind: 'block',
					type: 'controls_repeat_ext',
					inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: '10' } } } }
				},
				{ kind: 'block', type: 'logic_compare' },
				{ kind: 'block', type: 'logic_operation' },
				{ kind: 'block', type: 'logic_negate' },
				{ kind: 'block', type: 'logic_boolean' },
				{ kind: 'block', type: 'logic_ternary' },
				{
					kind: 'block',
					type: 'timer_sleep',
					inputs: { MS: { shadow: { type: 'math_number', fields: { NUM: '1000' } } } }
				},
				{ kind: 'block', type: 'ignore_output' }
			],
			categorystyle: 'logic_category'
		},
		{
			kind: 'Category',
			name: 'Math',
			contents: [
				{ kind: 'block', type: 'math_number' },
				{ kind: 'block', type: 'convert_float' },
				{
					kind: 'block',
					type: 'math_arithmetic',
					inputs: {
						A: { shadow: { type: 'math_number', fields: { NUM: '1' } } },
						B: { shadow: { type: 'math_number', fields: { NUM: '1' } } }
					}
				},
				{
					kind: 'block',
					type: 'math_single',
					inputs: { NUM: { shadow: { type: 'math_number', fields: { NUM: '9' } } } }
				},
				{
					kind: 'block',
					type: 'math_trig',
					inputs: { NUM: { shadow: { type: 'math_number', fields: { NUM: '45' } } } }
				},
				{ kind: 'block', type: 'math_constant' },
				{
					kind: 'block',
					type: 'math_number_property',
					inputs: { NUMBER_TO_CHECK: { shadow: { type: 'math_number', fields: { NUM: '2' } } } }
				},
				{
					kind: 'block',
					type: 'math_round',
					inputs: { NUM: { shadow: { type: 'math_number', fields: { NUM: '3.1' } } } }
				},
				// { kind: 'block', type: 'math_on_list' },
				{
					kind: 'block',
					type: 'math_modulo',
					inputs: {
						DIVIDEND: { shadow: { type: 'math_number', fields: { NUM: '64' } } },
						DIVISOR: { shadow: { type: 'math_number', fields: { NUM: '10' } } }
					}
				},
				{
					kind: 'block',
					type: 'math_constrain',
					inputs: {
						VALUE: { shadow: { type: 'math_number', fields: { NUM: '50' } } },
						LOW: { shadow: { type: 'math_number', fields: { NUM: '1' } } },
						HIGH: { shadow: { type: 'math_number', fields: { NUM: '100' } } }
					}
				},
				{
					kind: 'block',
					type: 'math_random_int',
					inputs: {
						FROM: { shadow: { type: 'math_number', fields: { NUM: '1' } } },
						TO: { shadow: { type: 'math_number', fields: { NUM: '100' } } }
					}
				},
				{ kind: 'block', type: 'math_random_float' },
				{
					kind: 'block',
					type: 'math_atan2',
					inputs: {
						X: { shadow: { type: 'math_number', fields: { NUM: '1' } } },
						Y: { shadow: { type: 'math_number', fields: { NUM: '1' } } }
					}
				}
			],
			categorystyle: 'math_category'
		},
		{
			kind: 'category',
			name: 'Text',
			contents: [
				{ kind: 'block', type: 'text' },
				{ kind: 'block', type: 'text_newline' },
				{ kind: 'block', type: 'text_join' },
				{
					kind: 'block',
					type: 'text_length2',
					inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'abc' } } } }
				},
				{
					kind: 'block',
					type: 'text_indexOf',
					inputs: { FIND: { shadow: { type: 'text', fields: { TEXT: 'abc' } } } }
				},
				{ kind: 'block', type: 'text_charAt' },
				{ kind: 'block', type: 'text_getSubstring' },
				{
					kind: 'block',
					type: 'text_changeCase',
					inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'abc' } } } }
				},
				{
					kind: 'block',
					type: 'text_trim',
					inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'abc' } } } }
				},
				{
					kind: 'block',
					type: 'text_count',
					inputs: { SUB: { shadow: { type: 'text', fields: { TEXT: 'abc' } } } }
				},
				{
					kind: 'block',
					type: 'text_replace',
					inputs: {
						FROM: { shadow: { type: 'text', fields: { TEXT: 'abc' } } },
						TO: { shadow: { type: 'text', fields: { TEXT: 'def' } } }
					}
				},
				{
					kind: 'block',
					type: 'text_reverse',
					inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'abc' } } } }
				}
			],
			categorystyle: 'text_category'
		},
		{
			kind: 'category',
			name: 'Lists',
			contents: [
				{ kind: 'block', type: 'lists_create_with', extraState: { itemCount: 0 } },
				{ kind: 'block', type: 'lists_create_with' },
				{
					kind: 'block',
					type: 'lists_repeat',
					inputs: { NUM: { shadow: { type: 'math_number', fields: { NUM: '5' } } } }
				},
				{ kind: 'block', type: 'lists_length' },
				{ kind: 'block', type: 'lists_isEmpty' },
				{ kind: 'block', type: 'lists_indexOf' },
				// { kind: 'block', type: 'lists_getIndex' },
				{
					kind: 'block',
					type: 'lists_custom_getindex',
					inputs: { INDEX: { shadow: { type: 'math_number', fields: { NUM: '1' } } } }
				},
				// { kind: 'block', type: 'lists_setIndex' },
				{
					kind: 'block',
					type: 'lists_setIndex2',
					inputs: { INDEX: { shadow: { type: 'math_number', fields: { NUM: '1' } } } }
				},
				{ kind: 'block', type: 'lists_addItem2' },
				{ kind: 'block', type: 'lists_getSublist' },
				{
					kind: 'block',
					type: 'lists_split',
					inputs: { DELIM: { shadow: { type: 'text', fields: { TEXT: ',' } } } }
				},
				{ kind: 'block', type: 'lists_sort' }
			],
			categorystyle: 'list_category'
		},
		{
			kind: 'category',
			name: 'Dictionaries',
			contents: [
				{ kind: 'block', type: 'dict_new' },
				{
					kind: 'block',
					type: 'dict_from_pairs',
					inputs: {
						VALUES: {
							block: {
								type: 'lists_create_with',
								extraState: { itemCount: 1 },
								inputs: {
									ADD0: {
										block: {
											type: 'lists_create_with',
											extraState: { itemCount: 2 },
											inputs: {
												ADD0: { block: { type: 'text', fields: { TEXT: 'key' } } },
												ADD1: { block: { type: 'text', fields: { TEXT: 'value' } } }
											}
										}
									}
								}
							}
						}
					}
				},
				{
					kind: 'block',
					type: 'dict_from_json',
					inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: '{"key": "value"}' } } } }
				},
				{
					kind: 'block',
					type: 'dict_getkey',
					inputs: {
						KEY: { shadow: { type: 'text', fields: { TEXT: 'key' } } },
						DEFAULT: { shadow: { type: 'text', fields: { TEXT: 'value' } } }
					}
				},
				{
					kind: 'block',
					type: 'dict_setkey',
					inputs: {
						KEY: { shadow: { type: 'text', fields: { TEXT: 'key' } } },
						VALUE: { shadow: { type: 'text', fields: { TEXT: 'value' } } }
					}
				},
				{
					kind: 'block',
					type: 'dict_deletekey',
					inputs: { KEY: { shadow: { type: 'text', fields: { TEXT: 'key' } } } }
				}
			],
			categorystyle: 'dictionary_category'
		},
		{
			kind: 'category',
			name: 'Variables',
			custom: 'VARIABLE',
			categorystyle: 'variable_category'
		},
		{
			kind: 'category',
			name: 'Persistence',
			contents: [
				{ kind: 'block', type: 'pvar_get' },
				// { kind: 'block', type: 'pvar_get_keyed' },
				{ kind: 'block', type: 'pvar_set' },
				// { kind: 'block', type: 'pvar_set_keyed' },
				{ kind: 'block', type: 'pvar_delete' }
				// { kind: 'block', type: 'pvar_delete_keyed' }
			],
			categorystyle: 'pvar_category'
		},

		{ kind: 'sep' },

		{
			kind: 'category',
			name: 'Legacy',
			contents: [
				{ kind: 'block', type: 'text_indexOf2' },
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
				},
				{
					kind: 'block',
					type: 'messaging_reply',
					inputs: {
						THREAD: { shadow: { type: 'trigger_message' } },
						TEXT: { shadow: { type: 'text', fields: { TEXT: 'Hello World' } } }
					}
				}
			],
			categorystyle: 'legacy_category'
		}
	]
}
export default toolbox
