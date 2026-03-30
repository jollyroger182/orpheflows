# Orpheflows: Slack workflows pro plus max

Build Slack workflows with Blockly (think Scratch)! For the [Hack Club Slack](https://hackclub.com/slack). Visit https://orpheflows.jollyy.dev to get started.

## Public API

Orpheflows has a public API that you can use to query, create, and modify your workflows. Visit https://orpheflows.jollyy.dev/docs to view the API docs.

## Technical details

The website is built with [Bun](https://bun.com/) and [SvelteKit](https://svelte.dev/). It uses the Slack Bolt framework to call Slack Web API methods. Slack posts events and interactions through [these endspoints](./src/routes/api/slack/).
