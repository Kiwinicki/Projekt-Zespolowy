import { useRef, useEffect, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { text, image, barcodes } from '@pdfme/schemas';

// To jest zakodowana pusta strona A4, którą pdfme na pewno zaakceptuje
const BLANK_PDF = 'data:application/pdf;base64,JVBERi0xLjQKJeb39/RyCjEgMCBvYmogPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+IGVuZG9iagoyIDAgb2JqIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvUmVzb3VyY2VzIDw8ID4+IC9NZWRpYUJveCBbIDAgMCA1OTUuMjggODQxLjg5IF0gL0NvbnRlbnRzIDQgMCBSID4+IGVuZG9iago0IDAgb2JqIDw8IC9MZW5ndGggMCA+PiBzdHJlYW0KZW5kc3RyZWFtIGVuZG9iagp0cmFpbGVyIDw8IC9Sb290IDEgMCBSIC9TaXplIDUgPj4KJSVFT0Y=';

function App() {
    const designerRef = useRef(null);
    const designerInstance = useRef(null);
    const [reportName, setReportName] = useState("Nowy Raport");

    useEffect(() => {
        if (designerRef.current && !designerInstance.current) {
            // Szablon z podkładem PDF zamiast samych wymiarów
            const initialTemplate = {
                basePdf: BLANK_PDF,
                schemas: [{}],
            };

            try {
                designerInstance.current = new Designer({
                    domContainer: designerRef.current,
                    template: initialTemplate,
                    plugins: {
                        text,
                        image,
                        qrcode: barcodes.qrcode
                    },
                });
                console.log("Designer załadowany!");
            } catch (err) {
                console.error("Błąd startu Designer:", err);
            }
        }

        return () => {
            if (designerInstance.current) {
                designerInstance.current.destroy();
                designerInstance.current = null;
            }
        };
    }, []);

    const saveToDatabase = async () => {
        if (!designerInstance.current) {
            alert("Edytor nie jest gotowy!");
            return;
        }

        try {
            const template = designerInstance.current.getTemplate();
            const payload = {
                name: reportName,
                schemaContent: JSON.stringify(template)
            };

            // Zmień na http (bez s) i port 5000
            const response = await fetch('http://localhost:5000/api/templates', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert("SUKCES! Zapisano w PostgreSQL.");
            } else {
                alert("Błąd serwera: " + response.status);
            }
        } catch (error) {
            alert("Błąd połączenia: " + error.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ padding: '10px', background: '#333', color: 'white', display: 'flex', gap: '10px' }}>
                <input
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    style={{ padding: '5px' }}
                />
                <button onClick={saveToDatabase} style={{ background: 'green', color: 'white', cursor: 'pointer', padding: '5px 15px' }}>
                    ZAPISZ DO BAZY
                </button>
            </div>
            <div style={{ flex: 1 }} ref={designerRef} />
        </div>
    );
}

export default App;