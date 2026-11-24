import { RenderMode, ServerRoute } from '@angular/ssr';

// As telas dependem de dados da API (produtos, pedidos, usuário logado), que não existem
// na hora do build. Por isso são renderizadas no navegador e não pré-renderizadas.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
