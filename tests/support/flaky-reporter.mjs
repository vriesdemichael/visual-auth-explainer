// Says which tests only passed on a second try. Retries keep CI from going red for nothing, and they
// also hide a test that is failing some of the time, which should not go unnoticed.
import { appendFileSync } from 'node:fs';

export default class FlakyReporter {
	flaky = [];

	onTestEnd(test) {
		if (test.outcome() === 'flaky') this.flaky.push(test.titlePath().filter(Boolean).join(' › '));
	}

	onEnd() {
		if (!this.flaky.length) return;
		const lines = [
			`Passed only when tried again (${this.flaky.length}):`,
			...this.flaky.map((title) => `- ${title}`)
		];
		console.log(`\n${lines.join('\n')}`);
		if (process.env.GITHUB_STEP_SUMMARY) {
			appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
		}
	}

	printsToStdio() {
		return false;
	}
}
