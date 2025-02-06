<svelte:options
  customElement={{
    tag: "dashboard-view",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extend: (customElementConstructor) => {
      return class extends customElementConstructor {
        // Add the function here, not below in the component so that
        // it's always available, not just when the inner Svelte component
        // is mounted

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setConfig(config) {
          const mergeObjects = (target, source) => {
            for (let key in source) {
              if (source.hasOwnProperty(key)) {
                if (
                  source[key] instanceof Object &&
                  !(source[key] instanceof Array)
                ) {
                  // If the property is an object (not an array), recursively merge it
                  target[key] = mergeObjects(target[key] || {}, source[key]);
                } else if (source[key] instanceof Array) {
                  // If the property is an array, handle each item in the array
                  // const targetType = typeof target[key]
                  target[key] = source[key].map((item) => {
                    if (item instanceof Object && key === "groups") {
                      return mergeObjects(new Group(), item);
                    } else {
                      return item;
                    }
                  });
                } else {
                  // Otherwise, assign the property directly
                  target[key] = source[key];
                }
              }
            }
            return target;
          };

          this.config = mergeObjects(new ExtendedViewConfig(), config);
          console.log(this.config);
        }
      };
    },
  }}
/>

<script lang="ts">
  import type { HomeAssistant, LovelaceViewConfig } from "custom-card-helpers";
  import {
    ExtendedViewConfig,
    FooterAction,
    Group,
    createRippleEffect,
  } from "./entities"; // Import the ExtendedViewConfig type
  import { get_current_component } from "svelte/internal";
  import { onMount } from "svelte";
  import Card from "./Card.svelte";
  import SidebarHeader from "./SidebarHeader.svelte";

  export let config: ExtendedViewConfig = new ExtendedViewConfig();
  export let hass: HomeAssistant;

  onMount(() => {
    console.log(hass);
  });

  const GetInputPos = (e: any) => {
    if (e.touches != undefined)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  function OnFooterClicked(footerAction: FooterAction) {
    hass.callService("browser_mod", "popup", {
      title: footerAction.name,
      content: footerAction.tap_action,
      size: "fullscreen",
    });
  }

  function OnFooterBtnMouseDown(
    e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
  ) {
    createRippleEffect(GetInputPos(e), e.currentTarget);
  }

  function OnFooterBtnTouchStarted(
    e: TouchEvent & { currentTarget: EventTarget & HTMLButtonElement }
  ) {
    createRippleEffect(GetInputPos(e), e.currentTarget);
  }

  // hack to register static functions on the component type
  const thisComponent = get_current_component();
  thisComponent.constructor.getConfigElement = (): HTMLElement => {
    return document.createElement("tag-name");
  };
  thisComponent.constructor.getStubConfig = (): any => ({
    entity: "input_boolean.tcwt",
    header: "",
  });
</script>

<main>
  {#if config.Sidebar}
    <div class="sidebar">
      <SidebarHeader></SidebarHeader>
      {#each config.Sidebar as card}
        <Card {hass} config={card} type={card.type} style="flex-grow: 0;" />
        <div style="height: 8px;"></div>
      {/each}
    </div>
  {/if}

  <div class="main">
    {#if config.groups}
      <div class="group-container">
        {#each config.groups as group}
          {@const gridDefinition = config
            ? `grid-template-columns: repeat(${group.Layout.columns}, ${group.Layout.size}px); 
                       grid-template-rows: repeat(${group.Layout.rows}, ${group.Layout.size}px);`
            : ""}
          <div class="card-container" style={gridDefinition}>
            <h1 class="header">{group.name}</h1>
            {#if group.cards}
              {#each group.cards as card}
                <Card {hass} config={card} type={card.type} />
              {/each}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if config.footer}
    <footer>
      {#each config.footer as footerAction}
        <button
          on:mousedown={OnFooterBtnMouseDown}
          on:touchstart={OnFooterBtnTouchStarted}
          on:mouseup={() => {
            OnFooterClicked(footerAction);
          }}
        >
          <ha-icon icon="mdi:{footerAction.icon}" class={`primaryico`} />
          {footerAction.name}
        </button>
      {/each}
    </footer>
  {/if}
</main>

<style>
  .sidebar {
    width: 300px;
    height: 100%;

    position: fixed;
    background-color: rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    border-right: 0.5px solid rgba(255, 255, 255, 0.1);
    padding: 16px;
  }

  footer {
    position: fixed;
    margin-left: 332px;
    padding: 16px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 16px;
    width: calc(100% - 332px - 55px);
  }

  footer > button {
    background-color: rgba(115, 115, 115, 0.1);
    color: rgb(151, 152, 156);
    padding: 8px 16px 8px 16px;

    border: 1px solid rgba(115, 115, 115, 0.2);
    border-radius: 10px;

    cursor: pointer;
  }

  .main {
    margin-left: 332px;
    height: 100%;
    padding: 16px;
  }

  .group-container {
    flex-direction: column;
    align-items: center;

    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: center;
    gap: 80px;
    padding: 50px;
  }

  .card-container {
    display: grid;
    gap: 10px;

    position: relative;
  }

  .card-container > .header {
    position: absolute;
    top: -55px;
  }

  @media (max-width: 768px) {
    .main {
      margin: auto;
      display: flex;
      align-items: center;
      flex-direction: column;
    }

    .group-container {
      flex-grow: 1;
    }

    .sidebar {
      display: none;
    }
  }

  :global(span.ripple) {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 600ms linear;
    background-color: rgba(0, 0, 0, 0.1);
  }

  @keyframes -global-ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
</style>
