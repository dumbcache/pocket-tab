const FILE_API_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

/**
 *
 * @param {File | Blob} file
 * @param {string} location
 * @param {string} id
 * @returns {Promise<number>}
 */
async function uploadFile(file, location, id) {
    const chunkSize = 20 * 256 * 1024; // 5 MB chunk size
    let offset = 0;
    let fileSize = file.size;
    while (offset < fileSize) {
        const chunk = file.slice(offset, offset + chunkSize);

        const startByte = offset;
        const endByte = Math.min(offset + chunkSize - 1, fileSize - 1);
        const contentRange = `bytes ${startByte}-${endByte}/${fileSize}`;

        const headers = new Headers();
        headers.append("Content-Length", chunk.size.toString());
        headers.append("Content-Range", contentRange);

        const res = await fetch(location, {
            method: "PUT",
            headers,
            body: chunk,
        });

        if (res.status === 200) {
            // console.info("Upload completed");
            return 200;
        }
        if (res.status !== 200 && res.status !== 308) {
            return 500;
        }
        postMessage({
            context: "PROGRESS",
            progressType: "SAVE",
            id,
            progress: Math.trunc((endByte / fileSize) * 100),
        });
        const rangeHeader = res.headers.get("Range");
        if (rangeHeader) {
            const [_, nextOffset] = rangeHeader.split("-").map(Number);
            offset = nextOffset + 1;
        } else {
            console.error("Range header not found in response.");
            return 500;
        }
    }
    return 200;
}

/**
 *
 * @param {ImgMeta} imgMeta
 * @param {string} token
 * @returns
 */
function createImgMetadata(imgMeta, token) {
    return new Promise(async (resolve, reject) => {
        const url = `${FILE_API_UPLOAD}?uploadType=resumable`;
        let req = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(imgMeta),
        });
        let { status, statusText } = req;
        if (status !== 200) {
            console.log(
                `error while creatingImgMetaData ${status} ${statusText}`
            );
            reject({ status });
        }
        resolve(req.headers.get("Location"));
    });
}

/**
 *
 * @param {DropItem} item
 * @param {string} token
 */
async function dropSave(item, token) {
    const { id, name, url, mimeType, parent, file } = item;
    /** @type {ImgMeta} */
    const imgMeta = {
        name: name || id,
        mimeType,
        parents: [parent],
        description: url || "",
    };

    createImgMetadata(imgMeta, token)
        .then(async (location) => {
            postMessage({
                context: "PROGRESS",
                progressType: "SAVE",
                id,
                progress: 0,
            });
            uploadFile(file, location, id)
                .then((status) => {
                    postMessage({
                        context: "SAVE",
                        id,
                        parent,
                        status: status === 200 ? "success" : " failure",
                    });
                })
                .catch((e) => {
                    postMessage({
                        context: "SAVE",
                        id,
                        parent,
                        status: "failure",
                    });
                });
        })
        .catch((e) => {
            postMessage({
                context: "SAVE",
                id,
                parent,
                status: "failure",
            });
        });
}

onmessage = ({ data }) => {
    let { token, dropItem } = data;
    switch (data.context) {
        case "SAVE":
            dropSave(dropItem, token);
            return;
    }
};
