import React from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Printer, CheckCircle, Hospital, Calendar, User, FileText } from 'lucide-react';

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Rincian Pembayaran Medis" maxWidth="max-w-2xl">
      <div className="space-y-6" id="printable-receipt">
        {/* Header Rumah Sakit */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Hospital size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">RUMAH SAKIT UTAMA SIMRS</h2>
              <p className="text-xs text-gray-400">Jl. Kesehatan No. 45, Jakarta • Telp: (021) 555-0199</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={billing.status}>{billing.status}</Badge>
            <p className="text-xs font-mono text-gray-400 mt-1">ID: BILL-{billing.ID || billing.id}</p>
          </div>
        </div>

        {/* Informasi Pasien & Tanggal */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <User size={16} className="text-indigo-400" />
            <div>
              <span className="text-xs text-gray-400 block">Nama Pasien:</span>
              <strong className="text-white">{billing.patient_name || 'Pasien'}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar size={16} className="text-indigo-400" />
            <div>
              <span className="text-xs text-gray-400 block">Tanggal Tagihan:</span>
              <strong className="text-white font-mono">
                {billing.created_at ? new Date(billing.created_at).toLocaleDateString('id-ID', {
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

        {/* Tabel Rincian Tindakan */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
            <FileText size={14} /> Rincian Tindakan Medis & Layanan
          </h4>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tindakan / Layanan</th>
                  <th className="text-right">Harga Satuan</th>
                  <th className="text-center">Jumlah</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(billing.item || billing.BillingItems || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium text-white">{item.item_name}</td>
                    <td className="text-right number-font">{formatIDR(item.unit_price)}</td>
                    <td className="text-center number-font">{item.quantity}</td>
                    <td className="text-right number-font font-semibold text-indigo-300">
                      {formatIDR(item.sub_total)}
                    </td>
                  </tr>
                ))}
                {(!billing.item && !billing.BillingItems) && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-3">Tidak ada detail item</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ringkasan Biaya & BPJS */}
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Total Tagihan Tindakan:</span>
            <span className="number-font text-white">{formatIDR(billing.total_amount)}</span>
          </div>
          <div className="flex justify-between text-cyan-400">
            <span>Klaim Subsidi BPJS Kesehatan:</span>
            <span className="number-font">- {formatIDR(billing.bpjs_amount)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between items-center font-bold text-base">
            <span className="text-white">Tagihan Bersih Pasien:</span>
            <span className="number-font text-emerald-400 text-lg">{formatIDR(billing.patient_amount)}</span>
          </div>
        </div>

        {/* Footer Cetak & Idempotensi Notice */}
        <div className="flex items-center justify-between pt-2 no-print">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle size={14} className="text-emerald-400" /> Transaksi Terverifikasi Sistem SIMRS
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn btn-secondary btn-sm">
              Tutup
            </button>
            <button onClick={handlePrint} className="btn btn-emerald btn-sm">
              <Printer size={16} /> Cetak Struk / Invoice
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
