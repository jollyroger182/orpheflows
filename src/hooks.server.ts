import cron from 'node-cron'

export { handle } from './auth'

cron.schedule('* * * * *', async () => {
	// TODO: run workflows
})
