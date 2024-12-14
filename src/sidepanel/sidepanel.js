import { mount } from "svelte";
import "./sidepanel.css";
import App from "./Sidepanel.svelte";

mount(App, {
    target: document.getElementById("app"),
});
