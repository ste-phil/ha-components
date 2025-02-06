<svelte:options
  customElement={{
    tag: "toggle-slider-card-2",
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

        static getConfigElement() {
          let elem = document.createElement("toggle-slider-card-editor-2");
          return elem;
        }

        static getStubConfig() {
          return {
            entity: "cover.my_cover",
            name: "",
          };
        }
      };
    },
  }}
/>

<script lang="ts">
  import type { HomeAssistant } from "custom-card-helpers";
  import { Group, ToggleSliderCardConfig } from "./entities";
  import { onMount } from "svelte";
  import { ripple } from "./ripple";

  interface Props {
    config?: ToggleSliderCardConfig;
    hass: HomeAssistant;
  }

  let { config = new ToggleSliderCardConfig(), hass }: Props = $props();

  // bindings to the slider and its container HTML elements
  let sliderElement: HTMLElement = $state();

  let init = false;

  let _isMouseDown = $state(false);
  let _hasMouseMoved = false;
  let _mouseDownPos: { x: number; y: number };
  let _mouseDownOffset: number;

  //settings for mouse hold down
  let _mouseHoldDelay_ms = 800;
  let _mouseMoveRegisterThreshold = 10;
  let _holdTimeoutId: number;

  //Settings to ignore hass udpates
  let _ignoreHassUpdates = false; //Used to ignore incoming updates while handling the slider
  let _ignoreHassTimeoutId: number; //The id of the timer that tracks elapsed time
  let _interactionUpdateIgnoreTime_ms = 1500;

  let _requestedPercentage: number | null = null;
  let _sliderWidthInPx: number = $state(0);
  let _sliderContainerWidthInPx: number = $state(0);

  onMount(() => {
    ["mouseup", "touchend"].forEach((name) => {
      document.addEventListener(name, (e) => OnMouseUp(e));
    });

    ["mousemove", "touchmove"].forEach((name) => {
      document.addEventListener(name, (e) => OnMouseMoved(e));
    });
  });

  // This is called when the hass state updates
  // aka pretty often
  $effect(() => {
    initSliderSizeInPx();

    const p = getDevicePercentage();
    _sliderWidthInPx = p * _sliderContainerWidthInPx;
  });

  //#region Properties
  function hasEntity() {
    return (
      config.entity != undefined &&
      config.entity != "" &&
      getHassEntityState() != undefined
    );
  }

  function getEntityType() {
    if (!hasEntity()) return "";
    return config.entity.split(".")[0];
  }

  function getHassEntityState() {
    return hass.states[config.entity];
  }

  function getEntityAttributes() {
    return getHassEntityState().attributes;
  }

  function getState() {
    const type = getEntityType();
    const state = getHassEntityState().state;
    switch (type) {
      case "cover":
        switch (state) {
          case "open":
            return "on";
          case "opening":
            return "off2on";
          case "closing":
            return "on2off";
          case "closed":
            return "off";
        }
      case "light":
        return state;
      default:
        return "unknown";
    }
  }

  function getEntityName() {
    if (config.name) return config.name;

    const friendlyName = getEntityAttributes().friendly_name;
    return friendlyName ? friendlyName : config.entity;
  }

  function getDevicePercentage() {
    const type = getEntityType();
    const attributes = getEntityAttributes();

    switch (type) {
      case "cover":
        return attributes.current_position / 100;
      case "light":
        return attributes.brightness / 255;
      default:
        return 0;
    }
  }

  function getRequestedPercentage() {
    if (!_requestedPercentage) _requestedPercentage = getDevicePercentage();

    return _requestedPercentage;
  }

  async function initSliderSizeInPx() {
    if (getHassEntityState() == undefined || init) return;

    let p = getRequestedPercentage();
    if (_sliderContainerWidthInPx != 0) {
      // console.log("initSliderSizeInPx", p, _sliderContainerWidthInPx);
      _sliderWidthInPx = p * _sliderContainerWidthInPx;
      init = true;
    }
  }

  function isOff() {
    const type = getEntityType();
    const state = getState();

    return state == "off";
  }

  function isOn() {
    const type = getEntityType();
    const state = getState();

    return state != "off";
  }

  function getInputPos(e: any) {
    if (e.touches != undefined)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  //#region UI Events
  function OnMouseDown(e: any) {
    _isMouseDown = true;
    _hasMouseMoved = false;

    _mouseDownPos = getInputPos(e);
    _mouseDownOffset = _sliderWidthInPx;

    if (_holdTimeoutId) clearTimeout(_holdTimeoutId);

    _holdTimeoutId = setTimeout(() => {
      if (_hasMouseMoved || !_isMouseDown) return;

      _isMouseDown = false;
      OpenDetailsPopup();
    }, _mouseHoldDelay_ms);
  }

  function OnMouseMoved(e: any) {
    if (!_isMouseDown) return;

    let mousePos = getInputPos(e);
    let diff = {
      x: mousePos.x - _mouseDownPos.x,
      y: mousePos.y - _mouseDownPos.y,
    };

    if (Math.abs(diff.x) > _mouseMoveRegisterThreshold || _hasMouseMoved) {
      let sliderSize = _mouseDownOffset + diff.x;
      sliderSize = Math.min(Math.max(sliderSize, 0), _sliderContainerWidthInPx);

      _sliderWidthInPx = sliderSize;
      _hasMouseMoved = true;
    }
  }

  function OnMouseUp(e: any) {
    if (!_isMouseDown) return;
    _isMouseDown = false;

    // If the mouse has moved, we don't want to trigger a click event
    if (_hasMouseMoved) {
      SetDevicePercentage(_sliderWidthInPx / _sliderContainerWidthInPx);
      return;
    }

    // Trigger a click event when the mouse has not moved
    const type = getEntityType();
    const state = getState();
    if (type == "cover" && (state == "on2off" || state == "off2on")) {
      Stop();
      _requestedPercentage = null;
      return;
    }

    if (isOn()) {
      TurnOff();
    } else {
      TurnOn();
    }
  }

  //#region HA interaction
  function OpenDetailsPopup() {
    hass.callService("browser_mod", "popup", {
      title: getEntityName(),
      content: {
        type: "custom:more-info-card",
        entity: config.entity,
      },
    });
  }

  function SetDevicePercentage(percentage: number) {
    _ignoreHassUpdates = true;
    if (_ignoreHassTimeoutId) clearTimeout(_ignoreHassTimeoutId);

    _ignoreHassTimeoutId = setTimeout(() => {
      _ignoreHassUpdates = false;
    }, _interactionUpdateIgnoreTime_ms);

    const type = getEntityType();
    switch (type) {
      case "cover":
        console.log("SetDevicePercentage", percentage * 100);
        hass.callService("cover", "set_cover_position", {
          entity_id: config.entity,
          position: percentage * 100,
        });
        break;
      case "light":
        hass.callService("light", "turn_on", {
          entity_id: config.entity,
          brightness: percentage * 255,
        });
        break;
    }
  }

  function TurnOff() {
    const type = getEntityType();
    switch (type) {
      case "cover":
        hass.callService("cover", "close_cover", {
          entity_id: config.entity,
        });
        break;
      case "light":
        hass.callService("light", "turn_off", {
          entity_id: config.entity,
        });
        break;
    }
  }

  function TurnOn() {
    const type = getEntityType();
    switch (type) {
      case "cover":
        hass.callService("cover", "open_cover", {
          entity_id: config.entity,
        });
        break;
      case "light":
        hass.callService("light", "turn_on", {
          entity_id: config.entity,
        });
        break;
    }
  }

  function Stop() {
    hass.callService("cover", "stop_cover", {
      entity_id: config.entity,
    });
  }
  //#endregion
</script>

<ha-card>
  {#if hasEntity()}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="card-content"
      class:on={isOn()}
      onmousedown={OnMouseDown}
      ontouchstart={OnMouseDown}
    >
      {#if getEntityType() == "light"}
        <svg
          id="light-icon"
          class="icon"
          class:icon-on={isOn()}
          viewBox="0 0 50 50"
          fill="#bdbdbd"
        >
          <path
            d="M27.4 47.3h-4.9s-.7.1-.7.8.4.9.7.9h4.9c.3 0 .7-.1.7-.9s-.7-.8-.7-.8zm3.3-2.9H19.3s-.8 0-.8.8.6.9.8.9h11.5c.2 0 .8-.1.8-.9-.1-.8-.9-.8-.9-.8zm0-3H19.3s-.8 0-.8.8.6.9.8.9h11.5c.2 0 .8-.1.8-.9-.1-.8-.9-.8-.9-.8zm0-2.9H19.3s-.8 0-.8.8.6.9.8.9h11.5c.2 0 .8-.1.8-.9s-.9-.8-.9-.8zm5.2-23.2c-3.3-5.3-7-5.6-10.9-5.6-3.8 0-8.4.4-10.9 5.6-.1.1-.1.3.1.7.4.8 3.3 7.2 3.2 18.8 0 1.1-.1 1.6 0 1.7 0 .1 0 .7 1.1.7h13c1 0 1-.5 1.1-.7v-1.7c-.1-11.6 2.8-18 3.2-18.8.1-.4.1-.5.1-.7"
          >
          </path>
          <path
            id="icon-color-area"
            class:light-on={isOn()}
            d="M14.1 15.3c3.4-.3 7-.4 10.9-.4 3.8 0 7.5.2 10.9.4.4-.4.7-.8.9-1.1C39 8.5 38.9 6.5 38.9 6c-.2-4.4-8.4-5-12.1-5h0-3.4c-3.7 0-12 .5-12.1 5 0 .5-.1 2.5 2.1 8.2 0 .3.3.8.7 1.1z"
          >
          </path>
        </svg>
      {:else if getEntityType() == "cover"}
        <svg
          id="cover-icon"
          class="icon"
          class:icon-on={isOn()}
          viewBox="0 0 416 308.92"
          style="scale:0.9 1"
        >
          <style>
            .cls-1 {
              fill: #bdbdbd;
            }

            svg > polygon {
              display: none;
            }

            svg.icon-on > polygon {
              display: block;
            }

            svg.icon-on > g {
              display: none;
            }
          </style>
          <linearGradient
            id="A"
            gradientUnits="userSpaceOnUse"
            x1="5.401"
            y1="34.714"
            x2="43.817"
            y2="11.74"
          >
            <stop offset="0" stop-color="#64acb7"></stop>
            <stop offset="1" stop-color="#7fdbe9"></stop>
          </linearGradient>
          <title>blinds</title>
          <path
            id="Frame"
            class="cls-1"
            d="M7407.5,7079.36v-31.91a11.32,11.32,0,0,0-11.29-11.32c-131.12-.4-262.24.48-393.36.08a11.31,11.31,0,0,0-11.35,11.31v31.85a11.32,11.32,0,0,0,11.32,11.32h29.79l-.71,227.75H7007.3a11.32,11.32,0,0,0-11.32,11.25l0,3.87a11.32,11.32,0,0,0,11.38,11.39l384.47-2.13a11.32,11.32,0,0,0,11.25-11.28v-1.74a11.32,11.32,0,0,0-11.32-11.36H7367.1V7090.68h29.08A11.32,11.32,0,0,0,7407.5,7079.36Zm-70.16,239.07H7061.66V7090.68H7338Z"
            transform="translate(-6991.5 -7036.02)"
          ></path>
          <polygon
            fill="url('#A')"
            points="70.16 282.41 345.84 282.41 346.5 54.66 70.16 54.66 70.16 282.41"
          />
          <g id="Blinds" style="transform: translateY(0px)">
            <rect
              class="cls-1"
              x="92"
              y="216.15"
              width="231.09"
              height="33"
              rx="10.67"
              ry="10.67"
            ></rect>
            <rect
              class="cls-1"
              x="92"
              y="170.05"
              width="231.09"
              height="33"
              rx="10.67"
              ry="10.67"
            ></rect>
            <rect
              class="cls-1"
              x="92.91"
              y="123.96"
              width="231.09"
              height="33"
              rx="10.67"
              ry="10.67"
            ></rect>
            <rect
              class="cls-1"
              x="92.45"
              y="78.81"
              width="231.09"
              height="33"
              rx="10.67"
              ry="10.67"
            ></rect>
          </g>
        </svg>
      {/if}
      <p id="label">{getEntityName()}</p>
      <div
        id="slider-box"
        bind:clientWidth={_sliderContainerWidthInPx}
        use:ripple={{ color: "rgba(0, 0, 0, 0.3)", duration: 600 }}
      >
        <div
          id="slider"
          bind:this={sliderElement}
          class:width-transition={!_isMouseDown}
          style="width: {_sliderWidthInPx}px"
        ></div>
        <!-- <div id="slider-actual"></div> -->
      </div>
    </div>
  {:else}
    <p>Select entity</p>
  {/if}
</ha-card>

<style>
  ha-card {
    overflow: hidden;
    cursor: pointer;
    border: none;
    /* background-color: rgba(115, 115, 115, 0.25); */
    border: 1px solid var(--divider-color);
    height: 100%;
  }

  /* .on {
    background-color: #dfe0e0;
  } */

  .card-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: start;
    height: calc(100% - 32px);
  }

  .card-content p {
    color: var(--secondary-text-color);
    font-weight: 500;
    margin: 0;
    font-size: 20px;
    user-select: none;
  }

  /* .card-content.on p {
    color: #4b5254;
  } */

  #slider-box {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  #slider {
    background-color: rgb(108 108 108 / 30%);
    height: 100%;
    z-index: 0;
    display: absolute;
  }

  .width-transition {
    transition: width 0.3s ease;
  }

  /* #slider-actual {
    display: none;
    z-index: 0;
    height: 50%;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.1);
  }

  #slider-actual.active {
    display: absolute;
  } */

  @keyframes kf-light-on {
    0% {
      transform: scale(0.85);
    }
    20% {
      transform: scale(1.1);
    }
    40% {
      transform: scale(0.95);
    }
    60% {
      transform: scale(1.03);
    }
    80% {
      transform: scale(0.97);
    }
    100% {
      transform: scale(1);
    }
  }

  .icon {
    width: min(60%, 48px);
    height: min(60%, 48px);
    transition: fill 0.3s ease;
    z-index: 1;
    right: 24px;
    position: absolute;
  }

  .light-on {
    animation: kf-light-on 0.8s;
    transform-origin: center;
    fill: #3389c2;
  }
</style>
