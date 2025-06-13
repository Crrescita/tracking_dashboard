import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('../custom-pages/custom-pages.module').then(
        (m) => m.CustomPagesModule
      ),
  },

  {
    path: 'pages',
    loadChildren: () =>
      import('./extrapages/extrapages.module').then((m) => m.ExtrapagesModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
