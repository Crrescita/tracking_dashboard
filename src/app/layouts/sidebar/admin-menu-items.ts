// src/app/layouts/sidebar/admin-menu-items.ts
import { MenuItem } from "./menu.model";

export const ADMIN_MENU: MenuItem[] = [
  {
    id: 1,
    label: "MENUITEMS.EXTRAPAGES.LIST.HOMEPAGE",
    link: "",
    icon: "ri-home-line",
    // parentId: 75,
  },

  {
    id: 2,
    label: "MENUITEMS.EXTRAPAGES.LIST.COMPANY",
    link: "/company",
    icon: "ri-building-4-line",
    // parentId: 75,
  },
];
