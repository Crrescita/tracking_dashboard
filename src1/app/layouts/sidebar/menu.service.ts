import { Injectable } from "@angular/core";
import { MenuItem } from "./menu.model";
import { ADMIN_MENU } from "./admin-menu-items";
import { COMPANY_MENU } from "./company-menu-items";

@Injectable({
  providedIn: "root",
})
export class MenuService {
  constructor() {}

  getMenu(userType: string): MenuItem[] {
    return userType === "administrator" ? ADMIN_MENU : COMPANY_MENU;
  }
}
