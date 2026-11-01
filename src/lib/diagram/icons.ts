import type { LifelineIcon } from '#lib/flow/vocabulary.ts';

const SHIELD = 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z';

/** Stroke paths on a 24 by 24 grid. */
export const ICONS: Readonly<Record<LifelineIcon, string>> = {
	browser:
		'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M12 15.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM8.5 20c.4-2 1.800-3 3.500-3s3.100 1 3.500 3',
	app: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
	idp: `${SHIELD}M9 12l2 2 4-4`,
	upstream: `${SHIELD}M12 16V9M9 12l3-3 3 3`,
	api: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
	attacker:
		'M12 3a8 8 0 0 0-8 8c0 2.800 1.500 4.800 4 6v3h8v-3c2.500-1.200 4-3.200 4-6a8 8 0 0 0-8-8zM9 11h.01M15 11h.01M10 20v-2M14 20v-2',
	people:
		'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.500-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M18 15c2 .6 3 2.400 3 5'
};
