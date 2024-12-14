<script>
    import { onMount } from "svelte";
    import bookIcon from "@assets/BookTab.svg?raw";
    import profileIcon from "@assets/profile.svg?raw";
    import TabGroup from "@components/tab/TabGroup.svelte";
    import ColorScheme from "@components/tab/ColorScheme.svelte";

    let tabGroups = $state([]);
    let lastSync = $state("");
    let isLoggedIn = $state(false);

    function handleLogin() {
        isLoggedIn = !isLoggedIn;
        chrome.runtime.sendMessage({
            context: isLoggedIn ? "LOGIN" : "LOGOUT",
        });
    }

    async function set() {
        let { groups, lastSynced, user } = await chrome.storage.local.get();
        tabGroups = groups ?? [];
        lastSynced && (lastSync = new Date(lastSynced).toLocaleString());
        user && (isLoggedIn = true);
    }

    chrome.runtime.onMessage.addListener(
        async (message, sender, sendResponse) => {
            let { context } = message;
            if (context === "CHANGE") {
                set();
            }
        }
    );

    onMount(async () => {
        set();
    });
</script>

<header>
    <div class="one">
        <span class="icon">{@html bookIcon}</span>
        <h1>BookTab</h1>
        {#if isLoggedIn}
            <p>{`last synced: ${lastSync}`}</p>
        {/if}
    </div>
    <div class="two">
        <ColorScheme />
        <button class="sign" onclick={handleLogin}
            ><span class="icon">
                {@html profileIcon}
            </span>
            {#if isLoggedIn}
                <sub>logout</sub>
            {:else}
                <sub>login</sub>
            {/if}
        </button>
    </div>
</header>
<main>
    {#each tabGroups as group (group.id)}
        <TabGroup {group} />
    {/each}
</main>

<style>
    header {
        position: sticky;
        top: 0rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2rem;
        border-bottom: 1px solid var(--color-focus);
        background-color: var(--color-bg);
    }

    .one {
        position: relative;
        display: flex;
        align-items: center;
        p {
            font-size: 1.3rem;
            position: absolute;
            top: 3.5rem;
            left: 0;
            width: fit-content;
        }
    }

    .two {
        display: flex;
        align-items: center;
        gap: 2rem;
    }
    .sign {
        display: flex;
        flex-direction: column;
        align-items: center;

        &:hover {
            color: var(--color-focus);
            .icon :global(svg),
            .icon :global(svg) {
                fill: var(--color-focus);
            }
        }
    }
    h1 {
        font-size: 3rem;
        font-family: var(--font-default);
    }
    .icon {
        width: var(--primary-icon-size);
        height: var(--primary-icon-size);
        padding-bottom: 0.1rem;
    }
    .icon :global(svg) {
        width: 100%;
        height: 100%;
    }
    main {
        padding: 1rem;
    }

    @media (max-width: 600px) {
        h1 {
            font-size: 2.6rem;
        }
    }
</style>
