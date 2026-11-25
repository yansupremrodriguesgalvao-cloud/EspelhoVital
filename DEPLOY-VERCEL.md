# Frontend na Vercel

Importe o repositorio yansupremrodriguesgalvao-cloud/EspelhoVital, branch master.
Framework Preset: Other. Root Directory: raiz. Sem comando de build; arquivos estaticos na raiz.
O vercel.json encaminha as rotas da API para https://espelhovital-back-r859.onrender.com.
Para publicar uma copia com seu proprio backend, troque o dominio em todos os destinos de vercel.json.
As rotas de API preservam os caminhos, incluindo /api/csrf, /api/login e /usuarios/cadastrar.
As respostas de API nao devem ser armazenadas em cache. O cookie de sessao fica no dominio do frontend.
Em localhost, js/config.js continua usando o backend local na porta 8081.

Depois do deploy, configure no Render:
APP_CORS_ORIGINS=https://SEU_DOMINIO_VERCEL
APP_FRONTEND_URL=https://SEU_DOMINIO_VERCEL

Use a URL estavel de producao, sem barra final. Para manter teste local, APP_CORS_ORIGINS aceita origens separadas por virgula.
Nao coloque senhas de banco nem chave Groq no frontend. Nenhuma variavel secreta e necessaria na Vercel.

Verifique no navegador: /api/csrf retorna JSON; cadastro; login; atualizar pagina mantendo sessao; logout.
No primeiro acesso apos inatividade, o Render gratuito pode demorar para iniciar.
A verificacao definitiva de cookies, CORS e CSRF deve ser feita no dominio publicado.