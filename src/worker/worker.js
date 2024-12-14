import {
    initContextMenus,
    installHandler,
    isSystemPage,
    isSystemTab,
    sendAll,
    sendExcept,
    sendLeft,
    sendOne,
    sendRight,
    startupHandler,
} from "./utils.js";
import { createFolder, fetchSingle, fetchFolders } from "./drive.js";

try {
    chrome.runtime.onInstalled.addListener(installHandler);

    chrome.runtime.onStartup.addListener(startupHandler);

    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    chrome.storage.onChanged.addListener(async (changes) => {
        try {
            if (changes.active) {
                initContextMenus();
            }
        } catch (error) {
            console.warn("Storage onChange error", error);
        }
    });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        try {
            switch (info.menuItemId) {
                case "create":
                    chrome.sidePanel.open({ tabId: tab.windowId });
                    return;
                case "display":
                    chrome.tabs.create({
                        url: "/sidepanel/sidepanel.html",
                        index: 0,
                        pinned: true,
                        active: false,
                    });
                    return;

                case "sendOne":
                    sendOne(tab);
                    return;
                case "sendAll":
                    sendAll(tab);
                    return;
                case "sendExcept":
                    sendExcept(tab);
                    return;
                case "sendLeft":
                    sendLeft(tab);
                    return;
                case "sendRight":
                    sendRight(tab);
                    return;
            }
        } catch (error) {
            console.warn("ContextMenu error:", error);
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            if (isSystemTab(sender.tab.url)) return;

            if (message.context === "LOGIN") {
                login();
                return;
            }

            if (message.context === "FOLDERS") {
                fetchFolders(message?.parent, "", message?.refresh).then(
                    ({ status, data }) => {
                        sendResponse({
                            status,
                            data,
                        });
                        return;
                    }
                );
                return true;
            }

            if (message.context === "FETCH_SINGLE") {
                fetchSingle(message.id).then(({ status, data }) => {
                    sendResponse({
                        status,
                        data,
                    });
                });
                return true;
            }

            if (message.context === "CREATE") {
                const { name, parent } = message;
                createFolder(name, parent).then(({ status, data }) => {
                    chrome.runtime.sendMessage({
                        context: "CREATE",
                        data,
                    });
                    sendResponse({
                        status,
                    });
                });
                return true;
            }
        } catch (error) {
            console.warn(`${message.context} error: ${error.cause}`);
            sendResponse({
                context: message.context,
                status: 500,
                error,
            });
        }
    });
} catch (error) {
    console.warn("Service Worker error:", error);
}
