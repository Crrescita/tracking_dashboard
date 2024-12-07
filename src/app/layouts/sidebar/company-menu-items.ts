// src/app/layouts/sidebar/company-menu-items.ts
import { MenuItem } from "./menu.model";

export const COMPANY_MENU: MenuItem[] = [
  {
    id: 1,
    label: "MENUITEMS.COMPANY.LIST.DASHBOARD",
    link: "/dashboard",
    icon: " bi bi-columns-gap",
  },
  {
    id: 6,
    label: "MENUITEMS.COMPANY.LIST.TIMESHEET",
    link: "/attendance-list",
    parentId: 5,
    icon: " ri-map-pin-time-fill",
  },
  {
    id: 7,
    label: "MENUITEMS.COMPANY.LIST.ATTENDANCE-REPORT",
    link: "/attendance-monthly",
    parentId: 5,
    icon: "  ri-folder-user-fill",
  },
  {
    id: 1,
    label: "MENUITEMS.COMPANY.LIST.EMPLOYEE",
    link: "/employee",
    icon: " ri-user-2-fill",
  },

  {
    id: 2,
    label: "MENUITEMS.COMPANY.LIST.BRANCH",
    link: "/branch-list",
    icon: "mdi mdi-office-building-cog-outline",
  },
  {
    id: 2,
    label: "MENUITEMS.COMPANY.LIST.DEPARTMENT",
    link: "/department-list",
    icon: "bi bi-people-fill",
  },
  {
    id: 4,
    label: "MENUITEMS.COMPANY.LIST.DESIGNATION",
    link: "/designation-list",
    icon: "ri-user-star-fill",
  },
  {
    id: 11,
    label: "MENUITEMS.COMPANY.LIST.ASSIGN-TASK",
    link: "/assign-task",
    icon: "  ri-todo-fill",
    parentId: 75,
  },
  // {
  //   id: 1,
  //   label: "MENUITEMS.COMPANY.LIST.EMPLOYEE-MANAGEMENT",
  //   icon: "ph-gauge",
  //   subItems: [
  //     {
  //       id: 2,
  //       label: "MENUITEMS.COMPANY.LIST.EMPLOYEE",
  //       link: "/employee",
  //       parentId: 1,
  //       icon: " ri-file-user-line",
  //     },
  //     {
  //       id: 3,
  //       label: "MENUITEMS.COMPANY.LIST.DEPARTMENT",
  //       link: "/department-list",
  //       parentId: 1,
  //       icon: " ri-file-user-line",
  //     },
  //     {
  //       id: 4,
  //       label: "MENUITEMS.COMPANY.LIST.DESIGNATION",
  //       link: "/designation-list",
  //       parentId: 1,
  //       icon: "  ri-user-star-fill",
  //     },
  //   ],
  // },

  // {
  //   id: 5,
  //   label: "MENUITEMS.COMPANY.LIST.ATTENDANCE",
  //   icon: " ri-file-user-line",
  //   subItems: [
  //     {
  //       id: 6,
  //       label: "MENUITEMS.COMPANY.LIST.ATTENDANCE",
  //       link: "/attendance-list",
  //       parentId: 5,
  //       icon: " ri-file-user-line",
  //     },
  //     {
  //       id: 7,
  //       label: "MENUITEMS.COMPANY.LIST.ATTENDANCE-MONTHLY",
  //       link: "/attendance-monthly",
  //       parentId: 5,
  //       icon: " ri-file-user-line",
  //     },
  //   ],
  // },
  {
    id: 11,
    label: "MENUITEMS.COMPANY.LIST.HOLIDAYS",
    link: "/holidays",
    icon: "bi bi-calendar-week-fill",
    parentId: 75,
  },

  {
    id: 8,
    label: "MENUITEMS.COMPANY.LIST.LEAVE-MANAGEMENT",
    icon: " ri-file-user-line",
    subItems: [
      {
        id: 9,
        label: "MENUITEMS.COMPANY.LIST.LEAVE-POLICY",
        link: "/leave-policy",
        parentId: 8,
        icon: " ri-file-user-line",
      },
      {
        id: 9,
        label: "MENUITEMS.COMPANY.LIST.LEAVE-TYPES",
        link: "/leave-types",
        parentId: 8,
        icon: " ri-file-user-line",
      },
      {
        id: 10,
        label: "MENUITEMS.COMPANY.LIST.LEAVE-APPLICATION",
        link: "/leave-requests",
        parentId: 8,
        icon: " ri-file-user-line",
      },
      {
        id: 10,
        label: "MENUITEMS.COMPANY.LIST.LEAVE-RECORD",
        link: "/leave-record",
        parentId: 8,
        icon: " ri-file-user-line",
      },
    ],
  },
  {
    id: 11,
    label: "MENUITEMS.COMPANY.LIST.NOTIFICATION",
    link: "/notification",
    icon: " ri-notification-4-fill",
    parentId: 75,
  },

  // More items...
];
