# Publicar o frontend na Vercel

1. Copie a URL HTTPS do seu backend no Render. Abra `/api/csrf` nesse endereço e confira se aparece um JSON com um token.
2. No arquivo [vercel.ts](vercel.ts), altere apenas `renderUrl` para a URL do seu backend, por exemplo `https://meu-backend.onrender.com`. Salve e envie a alteração ao GitHub.
3. Na Vercel, importe o repositório do frontend. Use a raiz do projeto, **Framework Preset: Other** e clique em **Deploy**.
4. No Render, em **Environment**, coloque o endereço HTTPS do frontend publicado em `APP_FRONTEND_URL`, sem barra no final, e publique novamente o backend. Se o serviço já tiver `APP_CORS_ORIGINS`, atualize esse campo para incluir a nova URL da Vercel.
5. Abra `/api/csrf` no endereço da Vercel e confira se aparece um token. Depois teste cadastro, login e logout no site.

A senha do Aiven fica no Render. Para rodar o frontend na máquina, inicie o backend na porta 8081 e abra o site com um servidor local como o Live Server.
