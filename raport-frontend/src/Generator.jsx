import { useState, useEffect } from 'react';
import { generate } from '@pdfme/generator';
import { text, image, barcodes } from '@pdfme/schemas';

const API_URL = 'http://localhost:5000/api';

function Generator() {
    const [templates, setTemplates] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [extraNotes, setExtraNotes] = useState("");

    // Pobieramy szablony i klientów przy starcie
    useEffect(() => {
        fetch(`${API_URL}/templates`).then(res => res.json()).then(setTemplates);
        fetch(`${API_URL}/data/clients`).then(res => res.json()).then(setClients);
    }, []);

    const handleDownload = async () => {
        if (!selectedTemplate || !selectedClient) {
            alert("Wybierz szablon i klienta!");
            return;
        }

        const template = JSON.parse(selectedTemplate.schemaContent);

        // MAPOWANIE DANYCH: Klucze muszą się zgadzać z nazwami pól w Designerze!
        const inputs = [{
            "nazwa_klienta": selectedClient.Name,
            "miasto": selectedClient.City,
            "osoba_kontaktowa": selectedClient.Contact,
            "uwagi": extraNotes,
            "data_wydruku": new Date().toLocaleDateString()
        }];

        try {
            const pdf = await generate({
                template,
                inputs,
                plugins: { text, image, qrcode: barcodes.qrcode }
            });

            const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Raport_${selectedClient.Name}.pdf`;
            link.click();
        } catch (error) {
            console.error(error);
            alert("Błąd generowania PDF");
        }
    };

    return (
        <div style={{ padding: '20px', background: '#f4f4f4', borderTop: '2px solid #ccc' }}>
            <h2>🚀 Generowanie Raportu</h2>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div>
                    <label>Wybierz Szablon:</label><br />
                    <select onChange={(e) => setSelectedTemplate(templates.find(t => t.id === e.target.value))}>
                        <option value="">-- wybierz --</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div>
                    <label>Wybierz Klienta (z bazy):</label><br />
                    <select onChange={(e) => setSelectedClient(clients.find(c => c.Id === parseInt(e.target.value)))}>
                        <option value="">-- wybierz --</option>
                        {clients.map(c => <option key={c.Id} value={c.Id}>{c.Name}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label>Dodatkowe uwagi (wpisz ręcznie):</label><br />
                <textarea
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    style={{ width: '100%', height: '60px' }}
                />
            </div>

            <button onClick={handleDownload} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                POBIERZ PDF
            </button>
        </div>
    );
}

export default Generator;