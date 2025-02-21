document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const channelId = document.getElementById('channelId').value.trim();
    const hours = document.getElementById('hours').value.trim();

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = 'Processing...';

    try {
        const response = await fetch("/stratus/api/retrieve-messages", {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            // Adicione o cabeçalho de autorização se necessário
            // 'Authorization': `Bearer ${process.env.API_TOKEN}`
            },
            body: JSON.stringify({ channelId, hours })
        });

        const data = await response.json();

        if (response.ok) {
            // Converter os dados recebidos em uma Blob
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Criar um elemento de link para download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `messages_${Date.now()}.txt`;
            downloadLink.textContent = 'Download Messages for the period(.txt)';


            resultDiv.innerHTML = `
                <p>Messages collected successfully!</p>
                <a href="/stratus/api/download-messages" download="messages_full.json">Download all Messages(.txt)</a>
            `;
            resultDiv.appendChild(downloadLink);

        } else {
            resultDiv.innerHTML = `<p class="error">Erro: ${data.error}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p class="error">Failed to connect to server.</p>`;
        console.error('Erro:', error);
    }
});
