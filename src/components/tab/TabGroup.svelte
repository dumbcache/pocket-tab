<script>
    import { fade } from "svelte/transition";
    import closeIcon from "@assets/close.svg?raw";
    import lockIcon from "@assets/lock.svg?raw";
    import unlockIcon from "@assets/unlock.svg?raw";
    let { group } = $props();

    function remove(group, tab) {
        chrome.runtime.sendMessage({
            context: "REMOVE",
            data: {
                group,
                tab,
            },
        });
    }
    function open(group) {
        chrome.runtime.sendMessage({
            context: "OPEN",
            data: {
                group,
            },
        });
    }
    function lock(l) {
        group.locked = l;
        chrome.runtime.sendMessage({
            context: "LOCK",
            data: {
                group: group.id,
                locked: l,
            },
        });
    }
    function rename(group, name) {
        chrome.runtime.sendMessage({
            context: "RENAME",
            data: {
                group,
                name,
            },
        });
    }
    function arrange(source, sourceParent, target, targetParent) {
        chrome.runtime.sendMessage({
            context: "ARRANGE",
            data: {
                source,
                sourceParent,
                target,
                targetParent,
            },
        });
    }
</script>

<section class="group" out:fade={{ duration: 200 }} id={group.id}>
    <div class="header">
        <div class="heading">
            <h4 class="gname ellipsis">
                {group.name}
            </h4>
            <sub>{`(${new Date(group.createdDate).toLocaleString()})`}</sub>
        </div>
        <div class="options">
            {#if group.locked}
                <button class="icon" onclick={() => lock(false)}
                    >{@html lockIcon}</button
                >
            {:else}
                <button class="icon" onclick={() => lock(true)}
                    >{@html unlockIcon}</button
                >
            {/if}
            <span>{group.tabs.length + " tabs"}</span>
            <button onclick={() => open(group.id)}>[open]</button>
            <button
                onclick={() => {
                    const title = window.prompt(
                        "Rename this tab group",
                        group.name
                    );
                    if (title && title !== group.name) {
                        rename(group.id, title);
                        group.name = title;
                    }
                }}>[edit]</button
            >
            <button
                style:visibility={group.locked ? "hidden" : "visible"}
                onclick={() => {
                    const s = window.confirm("Confirm deletion?");
                    if (s) remove(group.id);
                }}>[delete]</button
            >
        </div>
    </div>
    <ol>
        {#each group.tabs as tab (tab.id)}
            <li
                class="tab"
                id={tab.id}
                out:fade={{ duration: 200 }}
                draggable="true"
                ondragstart={(e) => {
                    e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({
                            sourceParentId: group.id,
                            sourceId: tab.id,
                        })
                    );
                    e.dataTransfer.effectAllowed = "move";
                }}
                ondragover={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    e.currentTarget.style.borderColor = "var(--color-focus)";
                }}
                ondragleave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-bg)";
                }}
                ondrop={(e) => {
                    const { sourceId, sourceParentId } = JSON.parse(
                        e.dataTransfer.getData("application/json")
                    );
                    const target = e.currentTarget;
                    const source = document.getElementById(sourceId);
                    target.parentNode.insertBefore(source, target);
                    e.currentTarget.style.borderColor = "var(--color-bg)";
                    arrange(sourceId, sourceParentId, tab.id, group.id);
                }}
            >
                <button
                    class:hide={group.locked}
                    class="close icon"
                    onclick={() => {
                        remove(group.id, tab.id);
                    }}>{@html closeIcon}</button
                >
                <img
                    src={tab.image || tab.icon}
                    alt=""
                    loading="lazy"
                    onerror={(e) => (e.target.style.visibility = "hidden")}
                />
                <a
                    class="tlink"
                    href={tab.url}
                    title={tab.url}
                    aria-label={tab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <p class="tname ellipsis">{tab.name}</p>
                </a>
            </li>
        {/each}
    </ol>
</section>

<style>
    .group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 2rem;
    }
    .header {
        padding: 1rem 0rem;
        display: flex;
        flex-direction: column;
        max-width: 50rem;
    }
    .heading {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
        sub {
            min-width: fit-content;
            font-size: 1.3rem;
        }
    }
    .gname {
        font-size: 1.6rem;
    }

    .options {
        display: flex;
        justify-content: space-evenly;
        align-items: center;

        button {
            font-size: 1.3rem;
            color: var(--color-focus);
        }
        button:hover {
            text-decoration: underline;
        }

        span {
            font-size: 1.3rem;
        }
    }

    .tab {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 0.5rem;
        border-top: 1px solid var(--color-bg);
        /* margin-left: 1.5rem; */
    }
    .tab:hover,
    .tab:focus {
        background-color: light-dark(
            var(--color-white-one),
            var(--color-black-one)
        );
    }

    .tab:hover .close {
        visibility: visible;
    }
    .tname {
        font-size: 1.4rem;
    }
    .tlink {
        /* display: inline-block; */
        color: inherit;
        /* width: fit-content; */
        text-decoration: none;
        /* color: var(--color-focus); */
    }
    a:hover,
    a:focus {
        text-decoration: underline;
    }
    img {
        width: 2.4rem;
        height: 2.4rem;
        object-fit: contain;
    }

    .icon {
        width: 2rem;
        height: 2rem;
    }
    .close {
        visibility: hidden;
        flex-shrink: 0;
    }
    .icon:hover :global(svg),
    .icon:focus :global(svg) {
        fill: var(--color-focus);
    }
    .hide,
    .tab:hover .hide {
        visibility: hidden;
    }

    @media (max-width: 600px) {
        .close {
            left: -7px;
        }
    }
</style>
