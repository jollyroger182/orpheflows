import * as Blockly from 'blockly'

export function register() {
	for (const [key, func] of Object.entries(extensions)) {
		if (Blockly.Extensions.isRegistered(key)) {
			Blockly.Extensions.unregister(key)
		}
		Blockly.Extensions.register(key, func)
	}
}

const extensions: Record<string, (this: Blockly.Block) => void> = {
	trigger() {
		this.setDeletable(false)
		this.setMovable(true)
	}
}
