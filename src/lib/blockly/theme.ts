import * as Blockly from 'blockly'

const theme = Blockly.Theme.defineTheme('orpheflows', {
	name: 'orpheflows',
	base: Blockly.Themes.Classic,
	blockStyles: {
		messaging_blocks: { colourPrimary: '300' },
		channel_blocks: { colourPrimary: '60' }
	},
	categoryStyles: {
		messaging_category: { colour: '300' }
	}
})
export default theme
