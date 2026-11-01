import type { RecordedMessage } from '#lib/recordings/format.ts';

const quoted = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;

/** Where a new one comes from, for what a server takes only once. */
const GOOD_ONCE: Readonly<Record<string, string>> = { code: 'redirect-with-code' };

function bodyArguments(message: RecordedMessage): string[] {
	const { body } = message;
	if (body === undefined) return [];
	const isForm = message.headers['content-type']?.includes('x-www-form-urlencoded');
	if (isForm && typeof body === 'object' && body !== null) {
		return Object.entries(body).map(
			([name, value]) => `--data-urlencode ${quoted(`${name}=${String(value)}`)}`
		);
	}
	return [`--data-raw ${quoted(typeof body === 'string' ? body : JSON.stringify(body))}`];
}

const carries = (message: RecordedMessage, name: string) =>
	new URL(message.url ?? '', 'http://any').searchParams.has(name) ||
	(typeof message.body === 'object' && message.body !== null && name in message.body);

/**
 * A recorded request as a command that would send it, from nothing but what the recording holds
 * (ADR-005). A request with something left out of it cannot be sent again, so it has no command.
 */
export function curlFor(
	message: RecordedMessage,
	numberOf: (step: string) => number | null
): string | null {
	if (message.direction !== 'request' || !message.url || !message.method) return null;
	if (message.bodyNote) return null;
	const command = [
		`curl -i -X ${message.method} ${quoted(message.url)}`,
		...Object.entries(message.headers).map(([name, value]) => `-H ${quoted(`${name}: ${value}`)}`),
		...bodyArguments(message)
	].join(' \\\n  ');
	const once = Object.entries(GOOD_ONCE)
		.filter(([name]) => carries(message, name))
		.map(([name, from]) => {
			const step = numberOf(from);
			return `# The ${name} in this was good once. ${step ? `A new one comes from step ${step}.` : 'It takes a new login to get another.'}`;
		});
	return [
		'# From one recorded run on one machine, with throwaway values, so its tokens have run out.',
		'# Never paste real secrets into a command like this.',
		...once,
		command
	].join('\n');
}
