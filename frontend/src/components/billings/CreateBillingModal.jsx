import React, { useState } from 'react';
import { Modal } from '../ui/Modal';

export const CreateBillingModal = ({
  isOpen,
  onClose,
  patients = [],
  tarifs = [],
  onSubmit,
}) => {
  const [selectedPatientUserId, setSelectedPatientUserId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [insuranceType, setInsuranceType] = useState('BPJS Kesehatan');
  const [customInsuranceName, setCustomInsuranceName] = useState('');
  const [insuranceClaimAmount, setInsuranceClaimAmount] = useState(0);
  const [selectedTarifIds, setSelectedTarifIds] = useState([]);
  const [tarifQuantities, setTarifQuantities] = useState({});

  // Derived calculation
  const selectedTarifsList = tarifs.filter((t) => selectedTarifIds.includes(t.ID || t.id));
  const calculatedTotalAmount = selectedTarifsList.reduce((sum, t) => {
    const price = typeof t.amount === 'number' ? t.amount : (t.amount ? parseFloat(t.amount) : (t.harga || 0));
    const qty = tarifQuantities[t.ID || t.id] || 1;
    return sum + (price * qty);
  }, 0);

  const isNoInsurance = insuranceType === 'Tanpa Asuransi (Mandiri)';
  const effectiveClaimAmount = isNoInsurance ? 0 : Number(insuranceClaimAmount || 0);
  const calculatedPatientAmount = Math.max(0, calculatedTotalAmount - effectiveClaimAmount);

  const handleInsuranceTypeChange = (e) => {
    const val = e.target.value;
    setInsuranceType(val);
    if (val === 'Tanpa Asuransi (Mandiri)') {
      setInsuranceClaimAmount(0);
    }
  };

  const handleTarifToggle = (id) => {
    if (selectedTarifIds.includes(id)) {
      setSelectedTarifIds(selectedTarifIds.filter((tId) => tId !== id));
      const nextQty = { ...tarifQuantities };
      delete nextQty[id];
      setTarifQuantities(nextQty);
    } else {
      setSelectedTarifIds([...selectedTarifIds, id]);
      setTarifQuantities({ ...tarifQuantities, [id]: 1 });
    }
  };

  const handleQuantityChange = (id, delta, e) => {
    if (e) e.stopPropagation();
    const current = tarifQuantities[id] || 1;
    const nextVal = Math.max(1, current + delta);
    setTarifQuantities({ ...tarifQuantities, [id]: nextVal });
  };

  const resetForm = () => {
    setSelectedPatientUserId('');
    setPatientName('');
    setInsuranceType('BPJS Kesehatan');
    setCustomInsuranceName('');
    setInsuranceClaimAmount(0);
    setSelectedTarifIds([]);
    setTarifQuantities({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim() || selectedTarifIds.length === 0) {
      alert('Harap isi nama pasien dan pilih minimal 1 tindakan medis');
      return;
    }

    const itemsPayload = selectedTarifIds.map((tId) => {
      const found = tarifs.find((t) => (t.ID || t.id) === tId);
      const price = typeof found?.amount === 'number' ? found.amount : (found?.amount ? parseFloat(found.amount) : (found?.harga || 0));
      return {
        action_id: Number(tId),
        tarif_id: Number(tId),
        item_name: found?.action_name || found?.nama || 'Tindakan Medis',
        quantity: Number(tarifQuantities[tId] || 1),
        unit_price: price,
      };
    });

    const finalInsuranceProvider = insuranceType === 'Lainnya' ? (customInsuranceName || 'Asuransi Swasta') : insuranceType;

    onSubmit({
      user_id: selectedPatientUserId ? Number(selectedPatientUserId) : 0,
      patient_user_id: selectedPatientUserId ? Number(selectedPatientUserId) : 0,
      patient_name: patientName,
      insurance_type: finalInsuranceProvider,
      insurance_provider: finalInsuranceProvider,
      insurance_claim: effectiveClaimAmount,
      insurance_claim_amount: effectiveClaimAmount,
      bpjs_claim: effectiveClaimAmount,
      action_ids: selectedTarifIds.map(Number),
      items: itemsPayload,
    }, resetForm);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Terbitkan Tagihan Medis SIMRS Baru"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
            Pilih Akun Pasien Terdaftar (Relasi Data)
          </label>
          <select
            value={selectedPatientUserId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedPatientUserId(id);
              const found = patients.find((p) => String(p.ID || p.id) === String(id));
              if (found) {
                const selectedName = found.full_name && found.full_name.trim() ? found.full_name.trim() : found.username;
                setPatientName(selectedName);
              }
            }}
            className="glass-input text-xs mb-2 text-[var(--text-primary)] bg-[var(--bg-input)]"
          >
            <option value="">-- (Opsional) Pilih Akun Pasien Terdaftar --</option>
            {patients
              .filter((p) => (p.role || '').toLowerCase() === 'pasien')
              .map((p) => {
                const displayName = p.full_name && p.full_name.trim() ? p.full_name.trim() : p.username;
                return (
                  <option key={p.ID || p.id} value={p.ID || p.id}>
                    {displayName} (Pasien SIMRS • ID #{p.ID || p.id})
                  </option>
                );
              })}
          </select>

          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
            Nama Pasien SIMRS
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="glass-input text-xs"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Penyedia Penjamin / Asuransi
            </label>
            <select
              value={insuranceType}
              onChange={handleInsuranceTypeChange}
              className="glass-input text-xs text-[var(--text-primary)] bg-[var(--bg-input)]"
            >
              <option value="BPJS Kesehatan">BPJS Kesehatan</option>
              <option value="Prudential">Prudential</option>
              <option value="Manulife">Manulife</option>
              <option value="Allianz">Allianz</option>
              <option value="FWD Insurance">FWD Insurance</option>
              <option value="AXA Mandiri">AXA Mandiri</option>
              <option value="Tanpa Asuransi (Mandiri)">Tanpa Asuransi (Mandiri)</option>
              <option value="Lainnya">Lainnya...</option>
            </select>

            {insuranceType === 'Lainnya' && (
              <div className="mt-2 animate-fade-in">
                <label className="block text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                  Nama Penyedia Asuransi Swasta (Lainnya)
                </label>
                <input
                  type="text"
                  value={customInsuranceName}
                  onChange={(e) => setCustomInsuranceName(e.target.value)}
                  placeholder="Masukkan nama penyedia asuransi (contoh: Sequis Life, Generali)..."
                  className="glass-input text-xs"
                  required
                />
              </div>
            )}
          </div>

          {!isNoInsurance && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
                Nominal Subsidi / Klaim (IDR)
              </label>
              <input
                type="number"
                min={0}
                value={insuranceClaimAmount}
                onChange={(e) => setInsuranceClaimAmount(Number(e.target.value))}
                placeholder="0"
                className="glass-input text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1.5">
            Pilih Items / Layanan Medis Ditindak
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {tarifs.map((t) => {
              const targetId = t.ID || t.id;
              const isSelected = selectedTarifIds.includes(targetId);
              const code = t.kode || targetId;
              const name = t.action_name || t.nama;
              const unitPrice = typeof t.amount === 'number' ? t.amount : (t.amount ? parseFloat(t.amount) : (t.harga || 0));
              const qty = tarifQuantities[targetId] || 1;
              const itemSubtotal = unitPrice * qty;

              return (
                <div
                  key={targetId}
                  onClick={() => handleTarifToggle(targetId)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-[var(--text-heading)] font-semibold'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-[var(--text-heading)]">{name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] block font-mono">
                      Ref Kode: #{code} • @ Rp {unitPrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSelected && (
                      <div
                        className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-emerald-500/40 rounded-lg p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleQuantityChange(targetId, -1, e)}
                          className="w-5 h-5 rounded bg-[var(--bg-subtle)] hover:bg-emerald-500/30 text-[var(--text-heading)] font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title="Kurangi Qty"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {qty}x
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleQuantityChange(targetId, 1, e)}
                          className="w-5 h-5 rounded bg-[var(--bg-subtle)] hover:bg-emerald-500/30 text-[var(--text-heading)] font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title="Tambah Qty"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      Rp {itemSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Preview */}
        <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 text-xs">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Total Bruto Tindakan:</span>
            <span className="font-mono text-[var(--text-primary)]">Rp {calculatedTotalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Klaim Penjamin ({insuranceType}):</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400">- Rp {effectiveClaimAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-[var(--text-heading)] pt-1 border-t border-[var(--border-color)]">
            <span>Beban Netto Pasien:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">Rp {calculatedPatientAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm cursor-pointer">
            Batal
          </button>
          <button type="submit" className="btn btn-emerald btn-sm cursor-pointer">
            Terbitkan Tagihan
          </button>
        </div>
      </form>
    </Modal>
  );
};
