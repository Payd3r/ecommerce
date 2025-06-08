// Modal per visualizzazione e modifica segnalazione
import { showBootstrapToast } from '../../../components/Toast.js';

export function showIssueModal(issue, onSave) {
    let modal = document.getElementById('issueDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'issueDetailsModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <form id="issue-details-form">
                <div class="modal-header">
                    <h5 class="modal-title">Dettagli Segnalazione</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
    <div class="mb-3">
        <label class="form-label">ID</label>
        <input type="text" class="form-control" name="id_issue" value="${issue.id_issue}" readonly>
    </div>
    <div class="mb-3">
        <label class="form-label">Titolo</label>
        <input type="text" class="form-control" name="title" value="${issue.title || ''}" readonly>
    </div>
    <div class="mb-3">
        <label class="form-label">Cliente</label>
        <input type="text" class="form-control" name="client_name" value="${issue.client_name || ''}" readonly>
    </div>
    <div class="mb-3">
        <label class="form-label">Stato</label>
        <select class="form-select" name="status" required>
            <option value="open" ${issue.status === 'open' ? 'selected' : ''}>Aperta</option>
            <option value="closed" ${issue.status === 'closed' ? 'selected' : ''}>Chiusa</option>
            <option value="refused" ${issue.status === 'refused' ? 'selected' : ''}>Rifiutata</option>
            <option value="solved" ${issue.status === 'solved' ? 'selected' : ''}>Risolta</option>
        </select>
    </div>
    <div class="mb-3">
        <label class="form-label">Data</label>
        <input type="date" class="form-control" name="created_at" value="${issue.created_at ? issue.created_at.split('T')[0] : ''}" readonly>
    </div>
    <div class="mb-3">
        <label class="form-label">Descrizione</label>
        <textarea class="form-control" name="description" rows="3" readonly>${issue.description || ''}</textarea>
    </div>
    <div class="mb-3">
        <label class="form-label">Nota admin</label>
        <textarea class="form-control" name="admin_note" rows="2" placeholder="Aggiungi una nota amministrativa...">${issue.admin_note || ''}</textarea>
    </div>
</div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                    <button type="submit" class="btn btn-primary">Salva Modifiche</button>
                </div>
                </form>
            </div>
        </div>`;
        document.body.appendChild(modal);
    } else {
        modal.querySelector('form').reset();
        modal.querySelector('input[name="id_issue"]').value = issue.id_issue;
        modal.querySelector('input[name="title"]').value = issue.title || '';
        modal.querySelector('input[name="client_name"]').value = issue.client_name || '';
        modal.querySelector('select[name="status"]').value = issue.status || '';
        modal.querySelector('input[name="created_at"]').value = issue.created_at ? issue.created_at.split('T')[0] : '';
        modal.querySelector('textarea[name="description"]').value = issue.description || '';
        modal.querySelector('textarea[name="admin_note"]').value = issue.admin_note || '';
    }

    // Gestione submit
    modal.querySelector('form').onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updated = {
            id_issue: formData.get('id_issue'),
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
            created_at: formData.get('created_at'),
            admin_note: formData.get('admin_note')
        };

        try {
            await onSave(updated);
            showBootstrapToast('Segnalazione aggiornata', 'Successo', 'success');
            const bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
            bsModal.hide();
        } catch (err) {
            showBootstrapToast(err.message || 'Errore durante il salvataggio.', 'Errore', 'danger');
        }
    };

    // Mostra il modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}
