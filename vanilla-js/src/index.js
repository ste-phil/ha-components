import { ToggleSliderCard } from "./card";
import { ToggleSliderCardEditor } from "./card-editor";

customElements.define(
    "toggle-slider-card",
    ToggleSliderCard
);

customElements.define(
    "toggle-slider-card-editor",
    ToggleSliderCardEditor
);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "toggle-slider-card",
    name: "Toggle Slider Card",
    description: "For lights & covers",
});
