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
