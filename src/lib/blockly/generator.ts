import * as Blockly from 'blockly'

const Order = {
	ATOMIC: 0
}

class OrphejsonGenerator extends Blockly.CodeGenerator {
	constructor(name: string = 'orphejson') {
		super(name)

		const generateCode = this._generateCode.bind(this)
		this.forBlock = new Proxy({} as (typeof this)['forBlock'], {
			get(target, prop) {
				return target[prop as string] ?? generateCode
			}
		})
	}

	scrub_(block: Blockly.Block, code: string, thisOnly?: boolean): string {
		const nextBlock = block.nextConnection?.targetBlock()
		if (nextBlock && !thisOnly) {
			return `${code},${this.blockToCode(nextBlock)}`
		}
		return code
	}

	workspaceToCode(workspace: Blockly.Workspace): string {
		const blocks = workspace
			.getTopBlocks(true)
			.filter((b) => b.type === 'trigger' && !b.getDisabledReasons().size)
		const codes = blocks
			.map((b) => this.blockToCode(b))
			.filter(Boolean)
			.map((v) => (typeof v === 'string' ? v : v[0]))

		return `[${codes.join(',')}]`
	}

	private _generateCode(block: Blockly.Block): string | [string, number] {
		const params: Record<string, unknown> = {}

		for (const input of block.inputList) {
			switch (input.type) {
				case Blockly.inputs.inputTypes.VALUE:
					params[input.name] = JSON.parse(
						this.valueToCode(block, input.name, Order.ATOMIC) || 'null'
					)
					break
				case Blockly.inputs.inputTypes.STATEMENT:
					params[input.name] = JSON.parse('[' + this.statementToCode(block, input.name) + ']')
					break
			}
			for (const field of input.fieldRow) {
				if (field.name && !field.name.startsWith('_')) {
					params[field.name] = field.getValue()
				}
			}
		}

		const code = JSON.stringify({ id: block.id, type: block.type, params })
		return block.outputConnection === null ? code : [code, Order.ATOMIC]
	}
}

export const generator = new OrphejsonGenerator()
