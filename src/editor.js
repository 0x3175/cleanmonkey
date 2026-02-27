const params = new URLSearchParams(window.location.search);
const editId = params.get('id');

const nameInput = document.getElementById('name');
const matchesInput = document.getElementById('matches');
const codeInput = document.getElementById('code');

// If editing, load existing script
if (editId) {
    document.getElementById('page-title').textContent = 'Edit Script';
    chrome.storage.local.get('scripts', (data) => {
        const script = (data.scripts || []).find(s => s.id === editId);
        if (script) {
            nameInput.value = script.name;
            matchesInput.value = script.matches;
            codeInput.value = script.code;
        }
    });
}

// Tab key inserts spaces instead of switching focus
codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;
        codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
        codeInput.selectionStart = codeInput.selectionEnd = start + 2;
    }
});

// Save
document.getElementById('save-btn').addEventListener('click', () => {
    const name = nameInput.value.trim();
    const matches = matchesInput.value.trim();
    const code = codeInput.value;

    if (!name || !matches) {
        alert('Name and match pattern are required.');
        return;
    }

    chrome.storage.local.get('scripts', (data) => {
        const scripts = data.scripts || [];

        if (editId) {
            const script = scripts.find(s => s.id === editId);
            if (script) {
                script.name = name;
                script.matches = matches;
                script.code = code;
            }
        } else {
            scripts.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name,
                matches,
                code,
                enabled: true
            });
        }

        chrome.storage.local.set({ scripts }, () => {
            window.close();
        });
    });
});

// Cancel
document.getElementById('cancel-btn').addEventListener('click', () => {
    window.close();
});
