import type { HomeAssistant, LovelaceBadgeConfig, LovelaceCardConfig, LovelaceViewConfig, ShowViewConfig } from 'custom-card-helpers';
import type { MouseEventHandler } from 'svelte/elements';

export class Layout {
  rows: number = 2;
  columns: number = 2;
  size: number = 100;
}


export class Group {
  public get Layout(): Layout {
    return { ...new Layout, ...this.layout };
  }

  name: string = "";
  layout: Layout = new Layout;
  cards?: LovelaceCardConfig[];
}

export class FooterAction {
  name: string = "";
  icon: string = "";
  tap_action: string = "";
}

export class ExtendedViewConfig implements LovelaceViewConfig {
  public get Sidebar(): LovelaceCardConfig[] {
    return this.sidebar ? this.sidebar : [];
  }

  private sidebar?: LovelaceCardConfig[];
  groups: Group[] = new Array<Group>();
  footer?: FooterAction[] = new Array<FooterAction>();

  index?: number;
  title?: string;
  badges?: Array<string | LovelaceBadgeConfig>;
  cards?: LovelaceCardConfig[];
  path?: string;
  icon?: string;
  theme?: string;
  panel?: boolean;
  background?: string;
  visible?: boolean | ShowViewConfig[];
}

export class ToggleSliderCardConfig implements LovelaceCardConfig {
  [key: string]: any;
  index?: number | undefined;
  view_index?: number | undefined;
  type: string;

  entity: string;
  name: string;
}


// export function createRippleEffect(cursorPos: { x: number, y: number }, currentTarget: EventTarget & HTMLButtonElement) {
export function createRippleEffect(event: MouseEvent) {
  const getInputPos = (e: any) => {
    if (e.touches != undefined)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  const cursorPos = getInputPos(event);
  const target = event.currentTarget as HTMLElement;
  target.style.position = "relative";
  target.style.overflow = "hidden";

  const circle = document.createElement("span");
  const diameter = Math.max(target.clientWidth, target.clientHeight);
  const radius = diameter / 2;

  const bounds = target.getBoundingClientRect();

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${cursorPos.x - bounds.left - radius}px`;
  circle.style.top = `${cursorPos.y - bounds.top - radius}px`;
  circle.classList.add("ripple");

  const ripple = target.getElementsByClassName("ripple")[0];
  if (ripple) {
    ripple.remove();
  }

  target.appendChild(circle);
}