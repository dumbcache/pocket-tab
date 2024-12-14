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
            const { active } = await chrome.storage.local.get("active");
            const url = new URL(redirectURL);
            const token = url.hash.split("&")[0].split("=")[1];
            const userinfo = await getUserInfo(token);
            await setUser(userinfo, token);
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
    clearUser();
    chrome.runtime.sendMessage(
        {
            context: "LOGOUT",
        },
        checkRuntimeError
    );
    console.log("session logged out");
};

export async function clearUser() {
    let { active, users, recents, roots, tokens } =
        await chrome.storage.local.get();
    users = users.filter((user) => user !== active);
    delete recents[active];
    delete roots[active];
    delete tokens[active];
    active = "";
    await chrome.storage.local.set({ active, users, tokens, roots, recents });
}

export async function setUser(userinfo, token) {
    const { email } = userinfo;
    let { users, active, tokens, roots, recents } =
        await chrome.storage.local.get();

    users ??= [];
    tokens ??= {};
    roots ??= {};
    recents ??= {};

    active = email;
    users.push(active);
    tokens[active] = token;
    roots[active] ??= await fetchRootDir(token);
    let session = Date.now() + 3599 * 1000;

    chrome.storage.local.set({
        active,
        users,
        tokens,
        roots,
        recents,
        session,
    });
}
