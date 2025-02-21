// filepath: /src/server.js
import { app } from './index.js';

const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});