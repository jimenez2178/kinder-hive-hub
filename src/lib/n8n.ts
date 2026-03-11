export async function getFraseDelDia(): Promise<string> {
    try {
        const res = await fetch("https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/frase-del-dia", {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) return "Educando con amor y propósito.";
        const data = await res.json();
        return data.frase || "Educando con amor y propósito.";
    } catch (error) {
        console.error("Error fetching n8n webhook:", error);
        return "Educando con amor y propósito.";
    }
}
