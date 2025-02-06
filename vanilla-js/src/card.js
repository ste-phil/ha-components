import html from "bundle-text:./card.html";
import iconLight from "bundle-text:./icon-light.html";
import iconCover from "bundle-text:./icon-cover.html";
import css from "bundle-text:./card.css";


export class ToggleSliderCard extends HTMLElement {
  // private properties
  _config;
  _hass;
  _elements = {};

  _isMouseDown = false;
  _hasMouseMoved = false;
  _mouseDownPos;
  _mouseDownOffset;

  //settings for mouse hold down
  _mouseHoldDelay_ms = 800;
  _mouseMoveRegisterThreshold = 10;
  _holdTimeoutId;

  //Settings to ignore hass udpates
  _ignoreHassUpdates = false;               //Used to ignore incoming updates while handling the slider
  _ignoreHassTimeoutId;                     //The id of the timer that tracks elapsed time
  _interactionUpdateIgnoreTime_ms = 1500;

  _requestedPercentage;

  // lifecycle
  constructor() {
    super();
    this.init();
  }

  setConfig(config) {
    this._config = config;
     if (!this._config.entity) {
      throw new Error("Please define an entity!");
    }
    this.UpdateConfig();
  }

  set hass(hass) {
    const first = !this._hass && hass;

    this._hass = hass;
    if (first)
      this.Start();

    this.UpdateHass();
  }

  //#region Properties
  getHassState() {
    return this._hass.states[this.getEntityID()];
  }
  
  isOff() {
    const type = this.getEntityType();
    const state = this.getState();

    return state == "off";
  }

  isOn() {
    const type = this.getEntityType();
    const state = this.getState();

    return state != "off";
  }
  
  getState() {
    const type = this.getEntityType();
    const state = this.getHassState().state;
    switch (type)
    {
      case "cover":
        switch (state) 
        {
          case "open":
            return "on";
          case "opening":
            return "off2on"
          case "closing":
            return "on2off"
          case "closed":
            return "off"
        }
      case "light":
        return state;
      default:
        return "unknown";
    }   
  }
  
  getEntityID() {
    return this._config.entity;
  }

  getEntityType() {
    let entityId = this.getEntityID();
    if (entityId.includes("light.")) {
      return "light";
    }
    if (entityId.includes("cover.")) {
      return "cover";
    }

    return "unknown";
  }



  getAttributes() {
    return this.getHassState().attributes;
  }

  getName() {
    if (this._config.name)
      return this._config.name

    const friendlyName = this.getAttributes().friendly_name;
    return friendlyName ? friendlyName : this.getEntityID();
  }

  getPercentage() {
    const type = this.getEntityType();
    const attributes = this.getAttributes();
    
    switch (type)
    {
      case "cover":
        return attributes.current_position / 100;
      case "light":
        return attributes.brightness / 255;
    }    
  }

  getSliderPercentage(percentage) {
    let totalWidth = this._elements.sliderBox.offsetWidth;

    return totalWidth * percentage;
  }

  sliderPercentage() {
    let totalWidth = this._elements.sliderBox.offsetWidth;
    let newWidth = this._elements.slider.offsetWidth;

    let percentage = newWidth / totalWidth;
    return percentage;
  }

  sliderToBrighness() {
    let brightnessValue = this.sliderPercentage() * 255;
    return brightnessValue;
  }

  getInputPos(e) {
    if (e.touches != undefined)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }
  //#endregion



  createRippleEffect(event) {
    const button = this._elements.card;
    const cursorPos = this.getInputPos(event);

    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const bounds = button.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${cursorPos.x - bounds.left - radius}px`;
    circle.style.top = `${cursorPos.y - bounds.top - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  }

  init() {

    //html setup
    const importBox = document.createElement("div");
    importBox.innerHTML = html;
    this._elements.card = importBox.firstElementChild;

    //style setup
    this._elements.style = document.createElement("style");
    this._elements.style.textContent = css;

    //attach to shadow dom
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(this._elements.style, this._elements.card);

    this.FindElements();

    //Ripple effect listener
    ["mousedown", "touchstart"].forEach((name) => {
      this._elements.cardContent.addEventListener(name, (e) => this.createRippleEffect(e));
    });

    //listen for events
    ["mousedown", "touchstart"].forEach((name) => {
      this._elements.sliderBox.addEventListener(name, (e) => this.OnMouseDown(e));
    });

    ["mousemove", "touchmove"].forEach((name) => {
      document.addEventListener(name, (e) => this.OnMouseMoved(e));
    });

    ["mouseup", "touchend"].forEach((name) => {
      document.addEventListener(name, (e) => this.OnMouseUp(e));
    });
  }

  FindElements() {
    const card = this._elements.card;
    this._elements.cardContent = card.querySelector(".card-content");
    this._elements.sliderBox = card.querySelector("#slider-box");
    this._elements.slider = card.querySelector("#slider");
    this._elements.sliderActual = card.querySelector("#slider-actual");
    this._elements.label = card.querySelector("#label");
    this._elements.icon = card.querySelector(".icon");
    this._elements.btn = card.querySelector("#btn");
    this._elements.iconColorArea = card.querySelector("#icon-color-area");
  }

  //#region Input Handling
  OnMouseDown(e) {
    this._isMouseDown = true;
    this._hasMouseMoved = false;

    this._mouseDownPos = this.getInputPos(e);
    this._mouseDownOffset = this._elements.slider.offsetWidth;

    //disable slider animation. Would interfere with the dragging
    // lookgs janky. but we still want it to be animated when not dragging
    this._elements.slider.classList.remove("width-transition");


    if (this._holdTimeoutId)
      clearTimeout(this._holdTimeoutId);
    
    this._holdTimeoutId = setTimeout(() => {
      if (this._hasMouseMoved || !this._isMouseDown)
        return;

      this._isMouseDown = false;
      this.OpenDetailsPopup();
    }, this._mouseHoldDelay_ms);
  }

  OnMouseMoved(e) {
    if (!this._isMouseDown)
      return;

      let mousePos = this.getInputPos(e);
    let diff = {
      x: mousePos.x - this._mouseDownPos.x,
      y: mousePos.y - this._mouseDownPos.y,
    };

    if (Math.abs(diff.x) > this._mouseMoveRegisterThreshold || this._hasMouseMoved) {
      let sliderSize = this._mouseDownOffset + diff.x;
      sliderSize = Math.min(Math.max(sliderSize, 0), this._elements.sliderBox.clientWidth);

      this._elements.slider.style.width = `${sliderSize}px`;
      this._hasMouseMoved = true;
    }
  }

  OnMouseUp(e) {
    if (!this._isMouseDown)
      return;
    this._isMouseDown = false;
    
    //enable slider animation again
    this._elements.slider.classList.add("width-transition");

    if (this._hasMouseMoved) 
    {
      this.SetPercentage();

      this._requestedPercentage = this.sliderPercentage();
      return;
    }

    const type = this.getEntityType();
    const state = this.getState();
    if (type == "cover" && (state == "on2off" || state == "off2on")) {
      this.Stop();
      this._requestedPercentage = null;
      return;
    }

    if (this.isOn()) {
      this.TurnOff()
    }
    else 
      this.TurnOn()
  }
  //#endregion

  SetPercentage() {
    this._ignoreHassUpdates = true;
    if (this._ignoreHassTimeoutId)
      clearTimeout(this._ignoreHassTimeoutId);

    this._ignoreHassTimeoutId = setTimeout(() => 
    {
      this._ignoreHassUpdates = false;
    }, this._interactionUpdateIgnoreTime_ms);

    const type = this.getEntityType();
    switch (type)
    {
      case "cover":
        this._hass.callService("cover", "set_cover_position",
        {
          entity_id: this.getEntityID(),
          position: this.sliderPercentage() * 100
        });
        break;
      case "light":
        this._hass.callService("light", "turn_on",
        {
          entity_id: this.getEntityID(),
          brightness: this.sliderToBrighness()
        });
        break;
    }    

    
  }

  TurnOff() {
    const type = this.getEntityType();
    switch (type)
    {
      case "cover":
        this._hass.callService("cover", "close_cover",
        {
          entity_id: this.getEntityID(),
        });
        break;
      case "light":
        this._hass.callService("light", "turn_off",
        {
          entity_id: this.getEntityID(),
        });
        break;
    }    
  }

  TurnOn() {
    const type = this.getEntityType();
    switch (type)
    {
      case "cover":
        this._hass.callService("cover", "open_cover",
        {
          entity_id: this.getEntityID(),
        });
        break;
      case "light":
        this._hass.callService("light", "turn_on",
        {
          entity_id: this.getEntityID(),
        });
        break;
    }    
  }

  Stop() {
    this._hass.callService("cover", "stop_cover",
    {
      entity_id: this.getEntityID(),
    });
  }

  OpenDetailsPopup() {
    this._hass.callService("browser_mod", "popup", {
      title: this.getName(),
      content: {
        type: "custom:more-info-card",
        entity: this.getEntityID()
      }
    })
  }

  UpdateConfig() {
    const importBox = document.createElement("div");
    if ("light" == this.getEntityType()) {
      importBox.innerHTML = iconLight;
    }
    else if ("cover" == this.getEntityType()) {
      importBox.innerHTML = iconCover;
    }

    this._elements.cardContent.prepend(importBox.firstChild);
    this.FindElements();
  }

  //Only called the first time hass updates
  Start() {
    this._requestedPercentage = this.getPercentage();
  }

  UpdateHass() {
    this._elements.label.innerText = this.getName();
    this._ignoreHassUpdates = this._requestedPercentage != null && Math.abs(this._requestedPercentage - this.getPercentage()) > 0.005;

    if (!this.getHassState() || this._isMouseDown || this._ignoreHassUpdates) {
      //State not set
      return;
    }

    if (this.isOff()) {
      this._elements.slider.style.width = `0px`;

      this._elements.card.classList.remove("on");
      this._elements.icon?.classList.remove("icon-on");
      this._elements.iconColorArea?.classList.remove("light-on");
    }
    else if (this.isOn()) {
      this._elements.slider.style.width = `${this.getSliderPercentage(this.getPercentage())}px`;

      this._elements.card.classList.add("on");
      this._elements.icon?.classList.add("icon-on");
      this._elements.iconColorArea?.classList.add("light-on");
    }
  }

  // card configuration
  static GetConfigElement() {
    return document.createElement("toggle-slider-card-editor");
  }

  static GetStubConfig() {
    return {
      entity: "input_boolean.tcwt",
      name: "",
    };
  }
}
