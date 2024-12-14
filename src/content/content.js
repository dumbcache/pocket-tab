import App from "./Content.svelte";
import "./content.css";

window.addEventListener("contextmenu", () => {
    if (window.location.host === "www.instagram.com") {
        const ele = document.querySelectorAll("._aagw");
        for (let i of ele) {
            i.style.display = "none";
        }
    }
});

/**
 * @returns {HTMLElement}
 */
export function createElement(type, attributes = [], ...childNodes) {
    const element = document.createElement(type);
    for (let [key, val] of attributes) {
        element.setAttribute(key, val);
    }
    childNodes.length !== 0 && element.append(...childNodes);
    return element;
}

function createRoot() {
    const shadowElement = createElement("div", [
        ["id", "pocket-drive-extension"],
    ]);
    const shadowRoot = shadowElement.attachShadow({ mode: "open" });
    const styles = chrome.runtime.getURL("content/content.css");
    const styleElement = createElement("link", [
        ["rel", "stylesheet"],
        ["href", styles],
    ]);
    shadowRoot.append(styleElement);

    new App({
        target: shadowRoot,
    });
    document.body.append(shadowElement);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.context === "IMAGES") {
            const root = document.getElementById("pocket-drive-extension");
            root ?? createRoot();
            for (let i of document.images) {
                i.draggable = true;
            }
            return;
        }
    } catch (error) {
        console.warn("pocket-drive-extension:", error);
    }
});
