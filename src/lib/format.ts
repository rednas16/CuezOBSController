/**
 * Small, pure formatting helpers used by the UI. Kept out of the components
 * so they are easy to unit test.
 */

/** "00:12:34.567" (as OBS reports it) -> "00:12:34". Empty input -> "00:00:00". */
export function formatTimecode(timecode: string): string {
	if (!timecode) return '00:00:00';
	return timecode.split('.')[0];
}

/** 184_000_000 -> "184 MB"; below 1 MB shows kB. */
export function formatBytes(bytes: number): string {
	if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
	if (bytes >= 1_000_000) return `${Math.round(bytes / 1_000_000)} MB`;
	return `${Math.round(bytes / 1000)} kB`;
}

/** "/Users/me/Movies/take 1.mov" -> "take 1.mov". Works for Windows paths too. */
export function fileName(path: string): string {
	return path.split(/[\\/]/).pop() ?? path;
}

/** ISO timestamp -> local "HH:MM:SS". */
export function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
}
