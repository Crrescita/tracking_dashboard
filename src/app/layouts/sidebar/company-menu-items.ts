// src/app/layouts/sidebar/company-menu-items.ts
import { MenuItem } from "./menu.model";

export const COMPANY_MENU: MenuItem[] = [
  {
    id: 1,
    label: "MENUITEMS.COMPANY.LIST.EMPLOYEE-MANAGEMENT",
    icon: "ph-gauge",
    subItems: [
      {
        id: 1,
        label: "MENUITEMS.COMPANY.LIST.EMPLOYEE",
        link: "/employee",
        parentId: 1,
        icon: " ri-file-user-line",
      },
      {
        id: 80,
        label: "MENUITEMS.COMPANY.LIST.DEPARTMENT",
        link: "/department-list",
        parentId: 1,
        icon: " ri-file-user-line",
      },
      {
        id: 80,
        label: "MENUITEMS.COMPANY.LIST.DESIGNATION",
        link: "/designation-list",
        parentId: 1,
        icon: " ri-file-user-line",
      },
    ],
  },

  {
    id: 2,
    label: "MENUITEMS.COMPANY.LIST.ATTENDANCE",
    link: "/attendance-list",

    icon: " ri-file-user-line",
  },

  {
    id: 3,
    label: "MENUITEMS.COMPANY.LIST.ATTENDANCE-MONTHLY",
    link: "/attendance-monthly",

    icon: " ri-file-user-line",
  },
  // More items...
];
