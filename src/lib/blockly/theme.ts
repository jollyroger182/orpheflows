import * as Blockly from 'blockly'

const theme = Blockly.Theme.defineTheme('orpheflows', {
	name: 'orpheflows',
	base: Blockly.Themes.Classic,
	blockStyles: {
		messaging_blocks: { colourPrimary: '300' },
		channel_blocks: { colourPrimary: '60' },
		user_blocks: { colourPrimary: '30' },
		form_blocks: { colourPrimary: '150' },
		trigger_blocks: { colourPrimary: '120', hat: 'cap' },
		pvar_blocks: { colourPrimary: '75' },
		integration_blocks: { colourPrimary: '105' }
	},
	categoryStyles: {
		messaging_category: { colour: '300' },
		channel_category: { colour: '60' },
		user_category: { colour: '30' },
		form_category: { colour: '150' },
		trigger_category: { colour: '120' },
		pvar_category: { colour: '75' },
		integration_category: { colour: '105' },
		legacy_category: { colour: '#000000' }
	}
})

const darkTheme = Blockly.Theme.defineTheme('orpheflows-dark', {
	name: 'orpheflows-dark',
	base: theme,
	// taken from @blockly/theme-dark
	componentStyles: {
		workspaceBackgroundColour: '#1e1e1e',
		toolboxBackgroundColour: '#333',
		toolboxForegroundColour: '#fff',
		flyoutBackgroundColour: '#252526',
		flyoutForegroundColour: '#ccc',
		flyoutOpacity: 1,
		scrollbarColour: '#797979',
		insertionMarkerColour: '#fff',
		insertionMarkerOpacity: 0.3,
		scrollbarOpacity: 0.4,
		cursorColour: '#d0d0d0'
	}
})

export default theme
export { theme as light, darkTheme as dark }
