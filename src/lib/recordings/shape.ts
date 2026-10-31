import type { RecordedMessage, Recording } from '#lib/recordings/format.ts';

/** The claims inside a JWT, without their values. */
function claimNames(value: unknown): string[] | null {
	if (typeof value !== 'string' || value.split('.').length !== 3) return null;
	try {
		const payload = value.split('.')[1];
		return Object.keys(JSON.parse(Buffer.from(payload, 'base64url').toString())).sort();
	} catch {
		return null;
	}
}

function pathOf(url: string): string {
	const { pathname } = new URL(url);
	// The only part of a path that changes between runs is the realm's generated login action.
	return pathname.replace(/\/login-actions\/[^/]+/, '/login-actions/*');
}

function queryNames(url: string): string[] {
	return [...new Set(new URL(url).searchParams.keys())].sort();
}

function bodyShape(body: unknown): unknown {
	if (body === null || typeof body !== 'object') return typeof body;
	return Object.fromEntries(
		Object.entries(body)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => [key, claimNames(value) ?? typeof value])
	);
}

function messageShape(message: RecordedMessage) {
	return {
		step: message.step,
		direction: message.direction,
		method: message.method,
		path: message.url ? pathOf(message.url) : undefined,
		query: message.url ? queryNames(message.url) : undefined,
		status: message.status,
		headers: Object.keys(message.headers).sort(),
		location: message.headers.location ? pathOf(message.headers.location) : undefined,
		locationQuery: message.headers.location ? queryNames(message.headers.location) : undefined,
		body: message.body === undefined ? undefined : bodyShape(message.body),
		bodyNote: message.bodyNote
	};
}

/**
 * What stays the same between two runs: which steps happened, which names they carried, and which
 * claims the tokens held. Codes, tokens, timestamps and signatures change every time and are left out.
 */
export function shapeOf(recording: Recording) {
	return {
		preset: recording.preset,
		messages: recording.messages.map(messageShape)
	};
}

export type RecordingShape = ReturnType<typeof shapeOf>;

/** The lines that differ between two shapes, so a person can read what a Keycloak release changed. */
export function shapeDifferences(before: RecordingShape, after: RecordingShape): string[] {
	const lines = (shape: RecordingShape) => shape.messages.map((message) => JSON.stringify(message));
	const [a, b] = [lines(before), lines(after)];
	const removed = a.filter((line) => !b.includes(line)).map((line) => `- ${line}`);
	const added = b.filter((line) => !a.includes(line)).map((line) => `+ ${line}`);
	return [...removed, ...added];
}
