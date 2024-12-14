import { fetchLocal } from "./cache.js";
import { getToken } from "./utils.js";

export const GDRIVE = "https://www.googleapis.com/drive/v3/files";
export const PAGE_SIZE = 500;

export const fetchRootDir = async (token) => {
    const res = await fetch(
        `${GDRIVE}?&pageSize=1&fields=files(id,name)&orderBy=createdTime`,
        {
            headers: { authorization: `Bearer ${token}` },
        }
    );
    if (res.status !== 200) {
        throw new Error(await res.text());
    }
    const { files } = await res.json();
    if (files.length === 0) {
        const id = createRootDir(token);
        return id;
    }
    return files[0].id;
};

export const createRootDir = async (token) => {
    let res = await fetch(GDRIVE, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            name: "Pocket_#Drive",
            mimeType: "application/vnd.google-apps.folder",
            folderColorRgb: "#f83a22",
            description: "",
        }),
    });
    let data = await res.json();
    if (res.status !== 200) {
        throw new Error(await res.text());
    }
    return data.id;
};

export const fetchSingle = async (id) => {
    const token = await getToken();
    let req = new Request(`${GDRIVE}/${id}?fields=name,id,parents`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const res = await fetchLocal(req);
    if (res.status !== 200) {
        throw new Error(await res.text());
    }
    const data = await res.json();
    return { status: 200, data };
};

/**
 *
 * @param {string} parent
 * @param {string} [pageToken]
 * @returns
 */
export async function fetchFolders(parent, pageToken = "", refresh = false) {
    const token = await getToken();
    let files = [];
    do {
        let url = `${GDRIVE}?q='${parent}' in parents and mimeType='application/vnd.google-apps.folder'&fields=nextPageToken,files(name,id,parents)&orderBy=name&pageSize=${PAGE_SIZE}`;
        pageToken && (url += `&pageToken=${pageToken}`);
        const req = new Request(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const res = await fetchLocal(req, refresh);
        if (res.status !== 200) {
            throw new Error(await res.text());
        }
        const data = await res.json();
        files.push(...data.files);
        pageToken = data.nextPageToken;
    } while (pageToken);
    return { status: 200, data: files };
}

/**
 *
 * @param {string} folderName
 * @param {string} parent
 * @returns
 */
export const createFolder = async (folderName, parent) => {
    const token = await getToken();
    const res = await fetch(GDRIVE, {
        method: "POST",
        headers: {
            "Content-Type": "applications/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parent],
        }),
    });
    if (res.status !== 200) {
        throw new Error(await res.text());
    }
    const { data } = await fetchFolders(parent, "", true);
    return { status: 200, data };
};
