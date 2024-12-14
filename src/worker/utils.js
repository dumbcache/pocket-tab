const HOSTNAME = new URL(chrome.runtime.getURL("")).hostname;
export const ENDPOINT = `http://127.0.0.1:5001/dumbcache4658/us-central1/pocketdrive`;
export const REDIRECT_URI = `https://${HOSTNAME}.chromiumapp.org/redirect`;
export const OAUTH = `https://accounts.google.com/o/oauth2/v2/auth?client_id=206697063226-p09kl0nq355h6q5440qlbikob3h8553u.apps.googleusercontent.com&prompt=select_account&response_type=token&scope=email https://www.googleapis.com/auth/drive.file&redirect_uri=${REDIRECT_URI}`;

export function checkRuntimeError() {
    chrome.runtime.lastError;
}

/**
 * @param {string} link
 */
export function isSystemTab(link) {
    return (
        link.startsWith("chrome://") ||
        link.startsWith("chrome-extension://") ||
        link.startsWith("chrome-search://")
    );
}

export function isLoggedIn() {
    return chrome.storage.local.get("token");
}

export function initContextMenus() {
    chrome.contextMenus.create(
        {
            id: "create",
            title: "Create",
            contexts: ["action"],
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "display",
            title: "Display",
            contexts: ["action", "page"],
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendOne",
            title: "send only this tab to PocketTab",
            contexts: ["page"],
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "seperator1",
            type: "separator",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendAll",
            title: "send all tabs to PocketTab",
            contexts: ["page"],
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "seperator2",
            type: "separator",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendExcept",
            title: "Send all tabs except this tab to PocketTab",
            contexts: ["page"],
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendRight",
            title: "send all tabs on right to PocketTab",
            contexts: ["page"],
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendLeft",
            title: "send all tabs on left to PocketTab",
            contexts: ["page"],
        },
        checkRuntimeError
    );
    console.log("Installed");
}

export function installHandler() {
    initContextMenus();
    chrome.storage.local.clear();
}

export function startupHandler() {}

export async function getUserInfo(token) {
    const req = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await req.json();
}

export async function getToken() {
    const { active, tokens } = await chrome.storage.local.get();
    return tokens[active];
}

/**
 * @typedef {Object} Tab
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} image
 *
 */

/**
 * @typedef {Object} TabGroup
 * @property {string} id
 * @property {string} name
 * @property {number} createdDate
 * @property {Array<Tab>} tabs
 */

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function add(tab) {
    const t = {
        title: tab.title,
        image: tab.favIconUrl,
        url: tab.url,
    };
}

export function remove() {}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function close(tab) {
    chrome.tabs.remove(tab.id);
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendOne(tab) {
    if (isSystemTab(tab.url)) return;
    add(tab);
    // close(tab);
}
/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendAll(tab) {
    chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
            if (isSystemTab(t.url)) continue;
            add(t);
            // close(t);
        }
    });
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendExcept(tab) {
    chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
            if (isSystemTab(t.url)) continue;
            if (t.index === tab.index) continue;
            add(t);
            // close(t);
        }
    });
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendLeft(tab) {
    chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
            if (isSystemTab(t.url)) continue;
            if (t.index >= tab.index) break;
            add(t);
            // close(t);
        }
    });
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendRight(tab) {
    chrome.tabs.query({}, (tabs) => {
        for (const t of tabs) {
            if (isSystemTab(t.url)) continue;
            if (t.index <= tab.index) continue;
            add(t);
            // close(t);
        }
    });
}
