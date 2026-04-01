export class BunWebsocketWrapper extends EventTarget {
	constructor(private _socket: Bun.ServerWebSocket<unknown>) {
		super()
	}

	send(...args: Parameters<Bun.ServerWebSocket['send']>): number {
		return this._socket.send(...args)
	}

	close(...args: Parameters<Bun.ServerWebSocket['close']>): void {
		this._socket.close(...args)
	}
}
