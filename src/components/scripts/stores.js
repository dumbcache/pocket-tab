import { writable } from "svelte/store";

export const ROOT_NAME = "Pocket_#Drive";
export const ROOT_ID = writable("");

/**
 * @type {import("svelte/store").Writable<Selected|null>}
 */
export const selected = writable();
export const isLoggedin = writable(false);
export const autoLink = writable(true);
export const autoSave = writable(true);
/**
 * @type {import("svelte/store").Writable<Array<DropItem>>}
 */
export const dropItems = writable([]);
export const link = writable("");
// export const tabName = writable("");
