# Biblioteca JWT — interface

Interface React com Next.js App Router. A página inicial faz o login e `/dashboard` reúne as seções protegidas do sistema. O atendente começa pela consulta ao acervo. O administrador vê o painel de totais e as opções de gestão.

## Instalação

Inicie o projeto `jwt-api` primeiro. Em outro PowerShell, abra a pasta deste projeto e rode:

```powershell
npm.cmd ci
Copy-Item .envex .env.local
npm.cmd run dev -- --port 3001
```

Abra http://localhost:3001 e entre com o e-mail e a senha do administrador configurados no .env da API. Para trocar a URL da API, edite `NEXT_PUBLIC_API_URL` no .env.local e reinicie o front-end. O valor padrão é http://localhost:3000/v1. Se mudar a porta do front-end, ajuste também `FRONTEND_URL` na API e reinicie os dois projetos.

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd start -- --port 3001
```

Use o último comando depois de compilar e encerrar o servidor de desenvolvimento, para rodar a versão de produção local.

## Sessão e componentes

- Componentes funcionais, props e hooks organizam as telas, os formulários e as tabelas. A camada de API está em `lib/api.js`.
- A interface guarda access e refresh token no `sessionStorage`. Eles ficam disponíveis ao recarregar a aba e são removidos no logout. JavaScript daquela origem pode ler o storage, portanto uma falha de XSS pode expor os tokens. Essa escolha segue o fluxo obrigatório com refresh no corpo e permite observar as chamadas no navegador.
- A tela protegida confirma a sessão em `/auth/me` antes de mostrar as seções. Quando a API responde 401, o cliente compartilha uma única promessa de renovação entre chamadas pendentes. Cada chamada repete o pedido uma vez com o novo token. Se o refresh falhar com 401, o cliente limpa a sessão e volta ao login.
- Ocultar menus de administração melhora a navegação. A API verifica o perfil nas rotas protegidas e retorna 403 para o atendente.

[Repositório-base da interface](https://github.com/ADS-Unipar/jwt-app)
