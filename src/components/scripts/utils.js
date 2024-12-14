import { dropItems, autoSave, link, selected, autoLink } from "@scripts/stores";
import { get } from "svelte/store";
import ChildWorker from "@scripts/webworker.js?worker";

let recentUpdateTimeout;
let clearFinishedTimeout;

/**
 * @param {FileList} files
 */
export async function previewAndSetDropItems(files) {
    let { name, url } = await getCurrentTabDetails();
    if (get(autoLink)) link.set(url);
    for (let file of files) {
        const id = Math.round(Math.random() * Date.now()).toString();
        const imgRef = URL.createObjectURL(file);
        let item = {
            id,
            name,
            displayName: file.name,
            mimeType: file.type,
            imgRef,
            status: "",
        };
        dropItems.set([...get(dropItems), item]);
        if (file.type.match("image/")) {
            if (
                file.type === "image/gif" ||
                file.type === "image/avif" ||
                file.type === "image/webp"
            ) {
                dropItems.update((prev) => {
                    return prev.map((i) => {
                        if (i.id === item.id)
                            return { ...i, file, loaded: true };
                        return i;
                    });
                });

                item.file = file;
                if (get(autoSave)) {
                    setTimeout(() => saveSingle(item), 500);
                }
            } else {
                const image = new Image();
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                image.onload = function () {
                    canvas.width = this.naturalWidth; // update canvas size to match image
                    canvas.height = this.naturalHeight;
                    ctx.drawImage(this, 0, 0);
                    canvas.toBlob(async function (blob) {
                        dropItems.update((prev) => {
                            let index = prev.findIndex((i) => i.id === item.id);
                            prev[index] = {
                                ...item,
                                file: blob,
                                mimeType: blob.type,
                                loaded: true,
                            };
                            return prev;
                        });
                        item.file = blob;
                        item.mimeType = blob.type;
                        if (get(autoSave)) {
                            setTimeout(() => saveSingle(item), 500);
                        }
                    }, "image/webp");
                };
                image.onerror = function () {
                    alert("Error in loading");
                };
                image.crossOrigin = ""; // if from different origin
                image.src = imgRef;
            }
        }
        if (file.type.match("video/")) {
            dropItems.update((prev) => {
                return prev.map((i) => {
                    if (i.id === item.id) return { ...i, file, loaded: true };
                    return i;
                });
            });
        }
    }
}

export async function saveAll() {
    let token = await getToken();
    let url = get(link).trim();
    let choosen = get(selected);
    get(dropItems).forEach((item) => {
        saveSingle(item, token, url, choosen);
    });
}

/**
 *
 * @param {DropItem} item
 * @param {string} [token]
 * @param {string} [url]
 * @param {Selected} [choosen]
 */
export async function saveSingle(item, token, url, choosen) {
    token ||= await getToken();
    url ||= get(link).trim();
    choosen ||= get(selected);
    let WorkerMessage = {
        context: "SAVE",
        dropItem: { ...item, parent: choosen.id, url },
        parent: choosen.id,
        token,
    };
    childWorker.postMessage(WorkerMessage);
    clearTimeout(recentUpdateTimeout);
    recentUpdateTimeout = setTimeout(() => {
        updateRecents(choosen);
    }, 1000);
    dropItems.update((prev) =>
        prev.map((i) => {
            if (i.id === item.id) return { ...i, status: "uploading" };
            return i;
        })
    );
}

export async function updateRecents(selected) {
    let { active, recents } = await chrome.storage.local.get();
    recents ??= {};
    let history = recents[active];
    history ??= [];
    history = history.filter((i) => i.id !== selected.id);
    history.unshift(selected);
    recents[active] = history;
    await chrome.storage.local.set({ recents });
}

export async function clearFinished() {
    dropItems.update((prev) => prev.filter((i) => i.status !== "success"));
}

export async function getCurrentTabDetails() {
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
    });
    return { name: tab?.title, url: tab?.url };
}

export async function getToken() {
    const { active, tokens } = await chrome.storage.local.get();
    return tokens[active];
}

export const childWorker = new ChildWorker();
childWorker.onerror = (e) => console.warn(e);
childWorker.onmessage = async ({ data }) => {
    let { id, parent, context, progressType, progress, status } = data;

    switch (context) {
        case "SAVE":
            dropItems.update((prev) =>
                prev.map((i) => {
                    if (i.id === id)
                        return {
                            ...i,
                            status: status === "success" ? "success" : "",
                        };
                    return i;
                })
            );
            if (status === "success") {
                clearTimeout(clearFinishedTimeout);
                clearFinishedTimeout = setTimeout(clearFinished, 2000);
            }
            return;

        case "PROGRESS":
            if (progressType === "SAVE") {
                let dropItem = document.querySelector(
                    `.drop-item[data-id="${id}"]`
                );
                dropItem.querySelector(
                    ".progress-count"
                ).innerHTML = `${progress}%`;
            }

            return;
    }
};
