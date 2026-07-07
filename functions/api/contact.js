function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function sanitize(value, maxLength) {
    return String(value || '')
        .trim()
        .slice(0, maxLength)
        .replace(/```/g, "'''");
}

export async function onRequestPost(context) {
    const webhookUrl = context.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        return jsonResponse({ success: false, message: 'Contact service is not configured.' }, 500);
    }

    let body;
    try {
        body = await context.request.json();
    } catch {
        return jsonResponse({ success: false, message: 'Invalid request body.' }, 400);
    }

    const { name, email, message, website } = body || {};

    if (website) {
        return jsonResponse({ success: true, message: 'Message sent successfully.' });
    }

    const safeName = sanitize(name, 120);
    const safeEmail = sanitize(email, 200);
    const safeMessage = sanitize(message, 2000);

    if (!safeName || !safeEmail || !safeMessage) {
        return jsonResponse({ success: false, message: 'Name, email, and message are required.' }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
        return jsonResponse({ success: false, message: 'Please enter a valid email address.' }, 400);
    }

    const payload = {
        embeds: [
            {
                title: 'New message from Hades Solutions',
                color: 0xff5a5a,
                fields: [
                    { name: 'Name', value: safeName, inline: true },
                    { name: 'Email', value: safeEmail, inline: true },
                    { name: 'Message', value: safeMessage },
                ],
                timestamp: new Date().toISOString(),
            },
        ],
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return jsonResponse(
                { success: false, message: 'Unable to send your message right now. Please try again later.' },
                502,
            );
        }

        return jsonResponse({
            success: true,
            message: 'Message sent successfully. We will get back to you soon.',
        });
    } catch {
        return jsonResponse(
            { success: false, message: 'Unable to send your message right now. Please try again later.' },
            502,
        );
    }
}
