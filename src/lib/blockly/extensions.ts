import * as Blockly from 'blockly'

export function register() {
	for (const [key, func] of Object.entries(extensions)) {
		if (Blockly.Extensions.isRegistered(key)) {
			Blockly.Extensions.unregister(key)
		}
		Blockly.Extensions.register(key, func)
	}
	for (const [key, mixin] of Object.entries(mixins)) {
		if (Blockly.Extensions.isRegistered(key)) {
			Blockly.Extensions.unregister(key)
		}
		Blockly.Extensions.registerMixin(key, mixin)
	}
}

const extensions: Record<string, () => void> = {
	messaging_v1_ext(this: MessagingV1Block) {
		this.getField('MODE')?.setValidator((value) => {
			this.mode = value
			this.updateShape_()
			return value
		})
		this.saveExtraState = () => ({ mode: this.mode })
		this.loadExtraState = ({ mode }: { mode: 'CHANNEL' | 'THREAD' }) => {
			this.mode = mode || 'CHANNEL'
			this.updateShape_()
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mixins: Record<string, any> = {
	messaging_v1_mixin: {
		updateShape_: function (this: MessagingV1Block) {
			const input = this.getInput('LOC')
			if (!input) return
			input.setCheck(this.mode === 'THREAD' ? 'Message' : 'Channel')
		},
		mode: 'CHANNEL'
	}
}

interface MessagingV1Block extends Blockly.Block {
	updateShape_: () => void
	mode: 'CHANNEL' | 'THREAD'
}
