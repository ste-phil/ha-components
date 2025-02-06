import './app.css'

// the editor card needs to be imported before the card
import ToggleSliderCardEditor from './lib/toggle-slider-card-editor.svelte'
import ToggleSliderCard from './lib/toggle-slider-card.svelte'

// const app = new App({
//   target: document.getElementById('app')!,
// })

// export default app
// @ts-ignore
window.customCards = window.customCards || [];


// @ts-ignore
window.customCards.push({
  type: "toggle-slider-card-2",
  name: "Toggle Slider Card 2",
  description: "Custom control for covers and lights",
  preview: true,
  configurable: true, // Optional - defaults to false
});