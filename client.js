function sendToWebhook() {
    const idOp = document.getElementById('idOp').value;
    const tasa = document.getElementById('tasa').value;
    const email = document.getElementById('email').value;

    const body = {
        'idOp': parseInt(idOp),
        'tasa': parseFloat(tasa),
        'email': email,
    };


    fetch('/updateSheet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al actualizar la hoja de cálculo.');
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.message);
        }
        const middlemanUrl = 'https://middleman-niqf.onrender.com/sendToWebhook';
        return fetch(middlemanUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al enviar al webhook.');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('message').innerText = '¡Éxito! La tasa ha sido actualizada.';
    })
    .catch(error => {
        console.error('Error capturado:', error);
        document.getElementById('message').innerText = error.message;
    });
}
