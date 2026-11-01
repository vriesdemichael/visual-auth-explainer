/** Each one once, because a recording never changes while the page is open. A failure can be retried. */
export function loadsOnce<T>(load: (key: string) => Promise<T>) {
	const loading = new Map<string, Promise<T>>();
	return (key: string) => {
		const known = loading.get(key);
		if (known) return known;
		const started = load(key);
		loading.set(key, started);
		started.catch(() => loading.delete(key));
		return started;
	};
}
