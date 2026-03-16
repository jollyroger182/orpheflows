import * as Blockly from 'blockly'

const Order = {
	ATOMIC: 0
}

export const generator = new Blockly.CodeGenerator('orphejson')

generator.scrub_ = (block, code, thisOnly) => {
	const nextBlock = block.nextConnection?.targetBlock()
	if (nextBlock && !thisOnly) {
		return `${code},${generator.blockToCode(nextBlock)}`
	}
	return code
}

generator.forBlock['test_block'] = (block) => {
	const value = block.getFieldValue('VALUE')

	return JSON.stringify({ type: 'test_block', params: { value } })
}

generator.forBlock['math_number'] = (block) => {
	const value = block.getFieldValue('NUM')

	return JSON.stringify(value)
}

generator.forBlock['controls_if'] = (block) => {
	type IfBlock = Blockly.Block & { elseifCount_: number; elseCount_: number }
	const ifCount = (block as IfBlock).elseifCount_ + 1
	const hasElse = !!(block as IfBlock).elseCount_

	const ifs = Array.from({ length: ifCount }).map((_, i) => ({
		test: generator.valueToCode(block, `IF${i}`, Order.ATOMIC),
		execute: generator.statementToCode(block, `DO${i}`)
	}))

	const else_ = hasElse ? generator.statementToCode(block, 'ELSE') : null

	return JSON.stringify({ type: 'controls_if', params: { ifs, else: else_ } })
}
