import { useRef, useEffect, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { generate } from '@pdfme/generator';
import { text, image, barcodes } from '@pdfme/schemas';

const BLANK_PDF = 'data:application/pdf;base64,JVBERi0xLjQKJeb39/RyCjEgMCBvYmogPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+IGVuZG9iagoyIDAgb2JqIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvUmVzb3VyY2VzIDw8ID4+IC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL0NvbnRlbnRzIDQgMCBSID4+IGVuZG9iago0IDAgb2JqIDw8IC9MZW5ndGggMCA+PiBzdHJlYW0KZW5kc3RyZWFtIGVuZG9iagp0cmFpbGVyIDw8IC9Sb290IDEgMCBSIC9TaXplIDUgPj4KJSVFT0Y=';
const API_URL = 'http://localhost:5000/api';

function App() {
    const [activeTab, setActiveTab] = useState('design');
    const [templates, setTemplates] = useState([]);
    const [extraNotes, setExtraNotes] = useState(""); 
    const [clients, setClients] = useState([]);
    const [reportName, setReportName] = useState("Nowy Szablon");

    const designerRef = useRef(null);
    const designerInstance = useRef(null);

    // --- 1. POBIERANIE DANYCH ---
    // Przeniosłem to tutaj, aby móc wywołać po zapisie szablonu
    const refreshData = async () => {
        try {
            const resT = await fetch(`${API_URL}/templates`);
            if (resT.ok) {
                const dataT = await resT.json();
                setTemplates(dataT || []);
            }
            const resC = await fetch(`${API_URL}/data/clients`);
            if (resC.ok) {
                const dataC = await resC.json();
                setClients(dataC || []);
            }
        } catch (e) {
            console.error("Błąd połączenia z API:", e);
        }
    };

    // --- 2. EFEKTY ---

    // Pobieranie danych przy starcie (zgodnie z zaleceniami ESLint)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const resT = await fetch(`${API_URL}/templates`);
                if (resT.ok) {
                    const textData = await resT.text();
                    setTemplates(textData ? JSON.parse(textData) : []);
                }
                const resC = await fetch(`${API_URL}/data/clients`);
                if (resC.ok) {
                    const textData = await resC.text();
                    setClients(textData ? JSON.parse(textData) : []);
                }
            } catch (err) {
                console.error("Błąd podczas startu:", err);
            }
        };
        loadInitialData();
    }, []);

    // Inicjalizacja edytora
    useEffect(() => {
        if (activeTab === 'design' && designerRef.current && !designerInstance.current) {
            designerInstance.current = new Designer({
                domContainer: designerRef.current,
                template: { basePdf: BLANK_PDF, schemas: [{}] },
                plugins: { text, image, qrcode: barcodes.qrcode },
            });
        }
        return () => {
            if (activeTab !== 'design' && designerInstance.current) {
                designerInstance.current.destroy();
                designerInstance.current = null;
            }
        };
    }, [activeTab]);

    // --- 3. AKCJE ---

    const saveTemplate = async () => {
        if (!designerInstance.current) return;
        try {
            const template = designerInstance.current.getTemplate();
            const payload = { name: reportName, schemaContent: JSON.stringify(template) };
            const res = await fetch(`${API_URL}/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Zapisano!");
                refreshData();
            }
        } catch (e) {
            console.error(e); 
            alert("Błąd zapisu.");
        }
    };

    const handleGeneratePdf = async () => {
        // 1. Pobieramy wybrane ID z rozwijanych list (select)
        const tId = document.getElementById('selTemp').value;
        const cId = document.getElementById('selCli').value;

        // 2. Szukamy obiektów w naszych listach (templates i clients)
        const template = templates.find(t => t.id === tId);
        const client = clients.find(c => (c.id || c.Id) == cId);

        // 3. Sprawdzamy, czy użytkownik wszystko wybrał
        if (!template || !client) {
            alert("Proszę wybrać szablon oraz klienta!");
            return;
        }

        try {
            // 4. Przygotowujemy dane do "wstrzyknięcia" do PDF
            // KLUCZE (po lewej) muszą być identyczne jak "Key" w Designerze!
            const inputs = [{
                nazwa_klienta: client.name || client.Name,
                miasto: client.city || client.City,
                email_klienta: client.email || client.Email, // Dane z PostgreSQL
                uwagi: extraNotes,                           // Twoje notatki z pola tekstowego
                data: new Date().toLocaleDateString(),       // Dzisiejsza data
                numer_raportu: `RAP/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`
            }];

            // 5. Uruchamiamy generator pdfme
            const pdf = await generate({
                template: JSON.parse(template.schemaContent),
                inputs: inputs,
                plugins: { text, image, qrcode: barcodes.qrcode }
            });

            // 6. Tworzymy plik i wywołujemy pobieranie w przeglądarce
            const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Raport_${client.name || client.Name}.pdf`;
            link.click();

        } catch (error) {
            console.error("Błąd podczas generowania pliku PDF:", error);
            alert("Nie udało się wygenerować raportu. Sprawdź konsolę (F12).");
        }
    };

    return (
        <div style={{ fontFamily: 'sans-serif' }}>
            {/* MENU */}
            <div style={{ display: 'flex', background: '#2c3e50' }}>
                <button onClick={() => setActiveTab('design')} style={{ padding: '15px 25px', background: activeTab === 'design' ? '#3498db' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    1. PROJEKTOWANIE
                </button>
                <button onClick={() => setActiveTab('generate')} style={{ padding: '15px 25px', background: activeTab === 'generate' ? '#3498db' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    2. GENEROWANIE
                </button>
            </div>

            {activeTab === 'design' && (
                <div style={{ height: 'calc(100vh - 50px)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px', background: '#ecf0f1', display: 'flex', gap: '10px' }}>
                        <input value={reportName} onChange={(e) => setReportName(e.target.value)} style={{ padding: '5px', width: '250px' }} />
                        <button onClick={saveTemplate} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>ZAPISZ</button>
                    </div>
                    <div ref={designerRef} style={{ flex: 1 }} />
                </div>
            )}
            {activeTab === 'generate' && (
                <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: '1px solid #ddd' }}>
                        <h2 style={{ marginTop: 0 }}>Generator Raportu</h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Szablon:</label>
                            <select id="selTemp" style={{ width: '100%', padding: '10px' }}>
                                <option value="">-- Wybierz --</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Klient:</label>
                            <select id="selCli" style={{ width: '100%', padding: '10px' }}>
                                <option value="">-- Wybierz --</option>
                                {clients.map(c => <option key={c.id || c.Id} value={c.id || c.Id}>{c.name || c.Name}</option>)}
                            </select>
                        </div>

                        {/* --- TUTAJ DODAJEMY NOWE POLE NA UWAGI --- */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Uwagi dodatkowe (ręcznie):</label>
                            <textarea
                                value={extraNotes}
                                onChange={(e) => setExtraNotes(e.target.value)}
                                placeholder="Wpisz tutaj uwagi, które pojawią się w PDF..."
                                style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>
                        {/* ----------------------------------------- */}

                        <button onClick={handleGeneratePdf} style={{ width: '100%', padding: '15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            POBIERZ PDF
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;