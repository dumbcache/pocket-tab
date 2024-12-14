import { fetchRootDir } from "./drive.js";
import { checkRuntimeError, getUserInfo, OAUTH } from "./utils.js";

export const login = async () => {
    chrome.identity.launchWebAuthFlow(
        { url: OAUTH, interactive: true },
        async (redirectURL) => {
            chrome.runtime.lastError && "";
            if (!redirectURL) {
                chrome.runtime.sendMessage(
                    {
                        context: "LOGIN",
                        status: 500,
                    },
                    checkRuntimeError
                );
                console.log("redirect failed");
                return;
            }
            const url = new URL(redirectURL);
            const token = url.hash.split("&")[0].split("=")[1];
            const userinfo = await getUserInfo(token);
            console.log(userinfo);
            console.log("session logged in");
            // if (!active) {
            chrome.runtime.sendMessage(
                {
                    context: "LOGIN",
                    status: 200,
                },
                checkRuntimeError
            );
            // }
        }
    );
};

export const logout = async () => {
    chrome.storage.local.set({ user: "", lastSynced: null, root: "" });
    console.log("session logged out");
};
