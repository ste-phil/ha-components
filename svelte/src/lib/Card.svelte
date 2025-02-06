<svelte:options customElement="expander-sub-card" />

<script lang="ts">
    import type { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';
    import { cardUtil } from './cardUtil';

    export let type = 'div';
    export let style = "height: 100%";
    export let config: LovelaceCardConfig;
    export let hass: HomeAssistant;

    let loading = true;
    const uplift = (
        node: HTMLElement,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        p: { type: string; hass: HomeAssistant }
    ) => ({
        // eslint-disable-next-line no-shadow
        update: (p: { type: string; hass: HomeAssistant }) => {
            if (node) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((node.firstChild as any)?.tagName) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (node.firstChild as any).hass = p.hass;
                    return;
                }
                void (async () => {
                    const el = (await cardUtil).createCardElement(config);
                    el.hass = p.hass;
                    node.innerHTML = '';
                    node.appendChild(el);
                    loading = false;
                })();
            }
        }
    });
</script>

<div use:uplift={{ type, hass }} class="card" class:loading={loading} style="{style}"></div>
<style>
    .card { 
        position: relative;
    }

    .loading:after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        background-size: 200% 100%;
        animation: loading-animation 1.5s infinite;
        border-radius: 5px;
    }

    @keyframes loading-animation {
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: 200px 0;
    }
}
</style>