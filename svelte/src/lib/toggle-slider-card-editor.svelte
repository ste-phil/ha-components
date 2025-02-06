<svelte:options
  customElement={{
    tag: "toggle-slider-card-editor-2",
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

          this.config = mergeObjects(new ToggleSliderCardConfig(), config);
          console.log(this.config);
        }
      };
    },
  }}
/>

<script lang="ts">
  import type { HomeAssistant } from "custom-card-helpers";
  import {
    Group,
    ToggleSliderCardConfig,
    createRippleEffect,
  } from "./entities";
  import { onMount } from "svelte";

  export let config: ToggleSliderCardConfig = new ToggleSliderCardConfig();
  export let hass: HomeAssistant;

  onMount(() => {
    console.log(hass);
  });
</script>

<ha-card>
  <!-- <ha-textfield
    class="input"
    autocomplete="off"
    autocorrect="off"
    helperpersistent
    label="Entity"
  ></ha-textfield> -->

  <p>IMHERE</p>

  <ha-entity-picker
    {hass}
    include-domains="['cover', 'light']"
    label="Entity"
    required
  />
  <ha-selector {hass} label="Entity" required></ha-selector>

  <ha-selector-select {hass} label="Entity"></ha-selector-select>

  <!-- <label for="name">Name</label>
  <input />

  <input /> -->
</ha-card>

<style>
</style>
