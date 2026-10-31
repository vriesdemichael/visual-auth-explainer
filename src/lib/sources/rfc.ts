export interface RfcSection {
	id: string;
	title: string;
}

/** The text is cut, never changed: joining every heading and body gives the document back (ADR-009). */
export interface RfcPart {
	section: string | null;
	heading: string;
	body: string;
}

// A heading starts at the left margin. The table of contents is indented, so it does not match.
const HEADING = /^(?:Appendix ([A-Z])|(\d+(?:\.\d+)*)|([A-Z](?:\.\d+)+))\. +(\S.*)$/gm;

export function splitRfc(text: string): { parts: RfcPart[]; sections: RfcSection[] } {
	const headings = [...text.matchAll(HEADING)].map((match) => ({
		id: match[1] ?? match[2] ?? match[3],
		title: match[4],
		start: match.index,
		end: match.index + match[0].length
	}));

	const parts: RfcPart[] = [
		{ section: null, heading: '', body: text.slice(0, headings[0]?.start ?? text.length) }
	];
	headings.forEach((heading, i) => {
		parts.push({
			section: heading.id,
			heading: text.slice(heading.start, heading.end),
			body: text.slice(heading.end, headings[i + 1]?.start ?? text.length)
		});
	});

	return { parts, sections: headings.map(({ id, title }) => ({ id, title })) };
}
