import * as Blockly from 'blockly'

const theme = Blockly.Theme.defineTheme('orpheflows', {
	name: 'orpheflows',
	base: Blockly.Themes.Classic,
	blockStyles: {
		messaging_blocks: { colourPrimary: '300' },
		channel_blocks: { colourPrimary: '60' },
		user_blocks: { colourPrimary: '30' },
		trigger: { colourPrimary: '120', hat: 'cap' },
		trigger_blocks: { colourPrimary: '120' }
	},
	categoryStyles: {
		messaging_category: { colour: '300' },
		channel_category: { colour: '60' },
		user_category: { colour: '30' },
		trigger_category: { colour: '120' }
	}
})
export default theme
