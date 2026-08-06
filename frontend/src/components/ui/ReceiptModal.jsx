import React from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Printer, CheckCircle, Hospital, Calendar, User, FileText, ExternalLink, Image as ImageIcon, CreditCard, ShieldCheck, Building } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, billing }) => {
  if (!billing) return null;

  const formatIDR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const items = billing.item || billing.BillingItems || [];
  const provider = billing.insurance_provider || 'BPJS Kesehatan';
  const claimAmount = billing.insurance_claim || billing.bpjs_amount || 0;

  const getPaymentMethodDisplay = () => {
    const method = billing.payment_method || (billing.proof_of_payment ? 'TRANSFER' : 'CASH');
    if (method === 'SPLIT') {
      const cash = formatIDR(billing.cash_amount);
      const transfer = formatIDR(billing.transfer_amount);
      return `SPLIT PAYMENT (${cash} Tunai Kasir + ${transfer} Transfer/EDC)`;
    }
    if (method === 'TRANSFER') return 'Transfer Bank (ImageKit Verified)';
    if (method === 'EDC') return 'Kartu Debit / EDC Kasir';
    return 'Tunai Kasir (Cash)';
  };

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const formattedDate = billing.created_at ? new Date(billing.created_at).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '-';

    const itemsHtml = items.length === 0 ? `
      <tr>
        <td colspan="5" style="text-align: center; padding: 10px; color: #64748b;">Tidak ada detail item tindakan medis.</td>
      </tr>
    ` : items.map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 8px; font-family: monospace;">${idx + 1}</td>
        <td style="font-weight: 600; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.item_name}</td>
        <td style="text-align: right; font-family: monospace; border: 1px solid #cbd5e1; padding: 6px 8px;">${formatIDR(item.unit_price)}</td>
        <td style="text-align: center; font-family: monospace; border: 1px solid #cbd5e1; padding: 6px 8px;">${item.quantity}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 700; border: 1px solid #cbd5e1; padding: 6px 8px;">${formatIDR(item.sub_total)}</td>
      </tr>
    `).join('');

    const proofHtml = billing.proof_of_payment ? `
      <div style="margin-top: 12px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #f8fafc;">
        <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
          Foto Bukti Transfer Bank (ImageKit Cloud Verified)
        </p>
        <div style="text-align: center;">
          <img src="${billing.proof_of_payment}" style="max-height: 140px; border-radius: 4px; border: 1px solid #cbd5e1;" />
        </div>
      </div>
    ` : '';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Pembayaran Medis - BILL-${billing.ID || billing.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
            
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; background: #ffffff; padding: 10px; font-size: 11px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8px; border-bottom: 2px solid #0f172a; margin-bottom: 12px; }
            .title { font-size: 17px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }
            .sub { font-size: 10px; color: #475569; }
            .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
            .doc-title { text-align: center; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 12px; }
            .meta-item { margin-bottom: 4px; }
            .meta-label { font-size: 10px; color: #64748b; display: block; }
            .meta-val { font-size: 11px; font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th { background-color: #f1f5f9; color: #0f172a; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 6px 8px; border: 1px solid #94a3b8; text-align: left; }
            td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a; }
            .summary-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 14px; }
            .summary-row { display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-bottom: 3px; }
            .summary-total { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 800; color: #0f172a; border-top: 1px solid #94a3b8; padding-top: 5px; margin-top: 5px; }
            .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center; margin-top: 20px; margin-bottom: 10px; }
            .signature-title { font-size: 10px; color: #475569; margin-bottom: 30px; }
            .signature-name { font-size: 10px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #64748b; display: inline-block; padding: 0 16px 2px 16px; }
            .footer-note { font-size: 8.5px; color: #64748b; text-align: center; font-style: italic; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">RUMAH SAKIT UTAMA SIMRS</div>
              <div class="sub">Sistem Informasi Manajemen Rumah Sakit • Divisi Keuangan & Billing</div>
              <div class="sub">Jl. Kesehatan No. 45, Jakarta Pusat 10110 • Telp: (021) 555-0199 • Fax: (021) 555-0200</div>
              <div class="sub" style="font-family: monospace;">www.simrs-utama.id • billing@simrs-utama.id</div>
            </div>
            <div style="text-align: right;">
              <div class="badge">${billing.status}</div>
              <div style="font-family: monospace; font-size: 11px; font-weight: 700; margin-top: 4px;">NO: #BILL-${billing.ID || billing.id}</div>
            </div>
          </div>

          <div class="doc-title">STRUK BUKTI PEMBAYARAN TAGIHAN MEDIS RESMI</div>

          <div class="meta-grid">
            <div>
              <div class="meta-item">
                <span class="meta-label">Nama Pasien:</span>
                <span class="meta-val">${billing.patient_name || 'Pasien SIMRS'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Metode Pembayaran:</span>
                <span class="meta-val">${getPaymentMethodDisplay()}</span>
              </div>
            </div>
            <div>
              <div class="meta-item">
                <span class="meta-label">Penyedia Asuransi:</span>
                <span class="meta-val">${provider}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Tanggal Transaksi:</span>
                <span class="meta-val">${formattedDate}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th>Tindakan / Layanan Medis</th>
                <th style="text-align: right;">Harga Satuan</th>
                <th style="text-align: center;">Jumlah</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal Tagihan Tindakan Medis:</span>
              <span style="font-family: monospace; font-weight: 600;">${formatIDR(billing.total_amount)}</span>
            </div>
            <div class="summary-row">
              <span>Klaim Subsidi ${provider}:</span>
              <span style="font-family: monospace; font-weight: 600;">- ${formatIDR(claimAmount)}</span>
            </div>
            <div class="summary-total">
              <span>TOTAL DIBAYAR PASIEN (LUNAS):</span>
              <span style="font-family: monospace; font-size: 13px;">${formatIDR(billing.patient_amount)}</span>
            </div>
          </div>

          ${proofHtml}

          <div class="signature-grid">
            <div>
              <div class="signature-title">Pasien / Penanggung Jawab</div>
              <div class="signature-name">( ${billing.patient_name || '........................'} )</div>
            </div>
            <div>
              <div class="signature-title">Petugas Kasir Keuangan RS</div>
              <div style="font-size: 9px; font-weight: 700; border: 1px solid #16a34a; color: #16a34a; padding: 1px 6px; display: inline-block; margin-bottom: 6px;">
                [ VERIFIKASI RESMI - SIMRS ]
              </div><br/>
              <div class="signature-name">( Petugas Kasir SIMRS )</div>
            </div>
          </div>

          <div class="footer-note">
            Bukti pembayaran ini diproses secara otomatis oleh Sistem Informasi Manajemen Rumah Sakit (SIMRS) Billing Engine dan merupakan dokumen sah.
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Rincian Pembayaran Medis Resmi" maxWidth="max-w-2xl">
      <div className="space-y-4 text-[var(--text-primary)]" id="printable-receipt">
        {/* Kop Surat Resmi Rumah Sakit */}
        <div className="pb-3 border-b-2 border-emerald-500/40 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Hospital size={28} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--text-heading)] tracking-wide uppercase">
                RUMAH SAKIT UTAMA SIMRS
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Sistem Informasi Manajemen Rumah Sakit • Divisi Keuangan & Billing
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Jl. Kesehatan No. 45, Jakarta Pusat 10110 • Telp: (021) 555-0199 • Fax: (021) 555-0200
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                www.simrs-utama.id • billing@simrs-utama.id
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={billing.status}>{billing.status}</Badge>
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              NO: #BILL-{billing.ID || billing.id}
            </p>
          </div>
        </div>

        {/* Judul Dokumen Invoice */}
        <div className="text-center bg-[var(--bg-card)] py-2 rounded-lg border border-[var(--border-color)]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-heading)]">
            STRUK BUKTI PEMBAYARAN TAGIHAN MEDIS RESMI
          </h3>
        </div>

        {/* Informasi Pasien & Rincian Administrasi */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <User size={14} className="text-emerald-500" />
              <div>
                <span className="text-[11px] text-[var(--text-secondary)] block">Nama Pasien:</span>
                <strong className="text-xs text-[var(--text-heading)] font-bold">{billing.patient_name || 'Pasien SIMRS'}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-emerald-500" />
              <div>
                <span className="text-[11px] text-[var(--text-secondary)] block">Metode Pembayaran:</span>
                <strong className="text-[var(--text-heading)]">
                  {getPaymentMethodDisplay()}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Building size={14} className="text-cyan-500" />
              <div>
                <span className="text-[11px] text-[var(--text-secondary)] block">Penyedia Asuransi:</span>
                <strong className="text-cyan-600 dark:text-cyan-300 font-bold">{provider}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-emerald-500" />
              <div>
                <span className="text-[11px] text-[var(--text-secondary)] block">Tanggal Transaksi:</span>
                <strong className="text-[var(--text-heading)] font-mono">
                  {billing.created_at ? new Date(billing.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Rincian Tindakan Medis */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
            <FileText size={13} className="text-emerald-500" /> Rincian Tindakan Medis & Layanan Kesehatan
          </h4>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10 text-center">No</th>
                  <th>Tindakan / Layanan Medis</th>
                  <th className="text-right">Harga Satuan</th>
                  <th className="text-center">Jumlah</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-[var(--text-secondary)] py-3">
                      Tidak ada detail item tindakan medis.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-center text-xs font-mono text-[var(--text-secondary)]">{idx + 1}</td>
                      <td className="font-semibold text-[var(--text-heading)]">{item.item_name}</td>
                      <td className="text-right number-font">{formatIDR(item.unit_price)}</td>
                      <td className="text-center number-font">{item.quantity}</td>
                      <td className="text-right number-font font-bold text-emerald-600 dark:text-emerald-300">
                        {formatIDR(item.sub_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ringkasan Kalkulasi Biaya & Subsidi BPJS/Asuransi */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-xs">
          <div className="flex justify-between text-[var(--text-primary)]">
            <span>Subtotal Tagihan Tindakan Medis:</span>
            <span className="number-font font-semibold text-[var(--text-heading)]">{formatIDR(billing.total_amount)}</span>
          </div>
          <div className="flex justify-between text-cyan-600 dark:text-cyan-400">
            <span>Klaim Subsidi {provider}:</span>
            <span className="number-font font-semibold text-cyan-600 dark:text-cyan-300">- {formatIDR(claimAmount)}</span>
          </div>
          <div className="border-t border-[var(--border-color)] pt-1.5 flex justify-between items-center font-bold text-xs">
            <span className="text-[var(--text-heading)] uppercase">TOTAL DIBAYAR PASIEN (LUNAS):</span>
            <span className="number-font text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">{formatIDR(billing.patient_amount)}</span>
          </div>
        </div>

        {/* Bukti Transfer ImageKit Cloud (Jika Ada) */}
        {billing.proof_of_payment && (
          <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <ImageIcon size={13} className="text-emerald-500" /> Foto Bukti Transfer Bank (ImageKit Cloud)
              </h4>
              <a 
                href={billing.proof_of_payment} 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Buka Foto Penuh <ExternalLink size={11} />
              </a>
            </div>
            <div className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-subtle)] p-1.5 max-h-32 flex items-center justify-center">
              <img 
                src={billing.proof_of_payment} 
                alt="Bukti Transfer ImageKit" 
                className="max-h-28 object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* Footer Catatan Hak Cipta & Tombol Cetak */}
        <div className="pt-1">
          <p className="text-[9px] text-[var(--text-muted)] text-center italic">
            Bukti pembayaran ini diproses secara otomatis oleh Sistem Informasi Manajemen Rumah Sakit (SIMRS) Billing Engine dan merupakan dokumen sah.
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <CheckCircle size={14} className="text-emerald-500" /> Transaksi Terverifikasi Sistem SIMRS
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm cursor-pointer">
                Tutup
              </button>
              <button type="button" onClick={handlePrint} className="btn btn-emerald btn-sm cursor-pointer shadow-md">
                <Printer size={16} /> Cetak Struk / Invoice (A4 / PDF)
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
