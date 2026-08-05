import React from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Printer, CheckCircle, Hospital, Calendar, User, FileText, ExternalLink, Image as ImageIcon, CreditCard, ShieldCheck } from 'lucide-react';

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

  const items = billing.item || billing.BillingItems || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Rincian Pembayaran Medis Resmi" maxWidth="max-w-2xl">
      <div className="space-y-6 text-gray-200" id="printable-receipt">
        {/* Kop Surat Resmi Rumah Sakit */}
        <div className="pb-4 border-b-2 border-indigo-500/40 print:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
              <Hospital size={32} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white print:text-slate-900 tracking-wide uppercase">
                RUMAH SAKIT UTAMA SIMRS
              </h2>
              <p className="text-xs text-gray-400 print:text-slate-600 font-medium">
                Sistem Informasi Manajemen Rumah Sakit • Divisi Keuangan & Billing
              </p>
              <p className="text-[11px] text-gray-400 print:text-slate-500 mt-0.5">
                Jl. Kesehatan No. 45, Jakarta Pusat 10110 • Telp: (021) 555-0199 • Fax: (021) 555-0200
              </p>
              <p className="text-[11px] text-indigo-400 print:text-slate-600 font-mono">
                www.simrs-utama.id • billing@simrs-utama.id
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={billing.status}>{billing.status}</Badge>
            <p className="text-xs font-mono text-indigo-400 print:text-slate-700 font-bold mt-1.5">
              NO: #BILL-{billing.ID || billing.id}
            </p>
          </div>
        </div>

        {/* Judul Dokumen Invoice */}
        <div className="text-center bg-white/5 print:bg-slate-100 py-2 rounded-lg border border-white/10 print:border-slate-300">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white print:text-slate-900">
            STRUK BUKTI PEMBAYARAN TAGIHAN MEDIS RESMI
          </h3>
        </div>

        {/* Informasi Pasien & Rincian Administrasi */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10 print:bg-slate-50 print:border-slate-300 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User size={15} className="text-indigo-400 print:text-slate-700" />
              <div>
                <span className="text-[11px] text-gray-400 print:text-slate-500 block">Nama Pasien:</span>
                <strong className="text-sm text-white print:text-slate-900 font-bold">{billing.patient_name || 'Pasien SIMRS'}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-indigo-400 print:text-slate-700" />
              <div>
                <span className="text-[11px] text-gray-400 print:text-slate-500 block">Metode Pembayaran:</span>
                <strong className="text-white print:text-slate-900">
                  {billing.proof_of_payment ? 'Transfer Bank (ImageKit Verified)' : 'Kasir Tunai / EDC SIMRS'}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-indigo-400 print:text-slate-700" />
              <div>
                <span className="text-[11px] text-gray-400 print:text-slate-500 block">Tanggal Transaksi:</span>
                <strong className="text-white print:text-slate-900 font-mono">
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
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-400 print:text-slate-700" />
              <div>
                <span className="text-[11px] text-gray-400 print:text-slate-500 block">Status Verifikasi Kasir:</span>
                <strong className="text-emerald-400 print:text-slate-900 font-bold">
                  {billing.status === 'PAID' ? 'LUNAS (Terverifikasi)' : billing.status}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Rincian Tindakan Medis */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 print:text-slate-900 mb-2 flex items-center gap-1.5">
            <FileText size={14} className="text-indigo-400 print:text-slate-700" /> Rincian Tindakan Medis & Layanan Kesehatan
          </h4>
          <div className="table-container print:border print:border-slate-300">
            <table className="table print-table">
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
                    <td colSpan={5} className="text-center text-gray-400 print:text-slate-600 py-4">
                      Tidak ada detail item tindakan medis.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-center text-xs font-mono text-gray-400 print:text-slate-600">{idx + 1}</td>
                      <td className="font-semibold text-white print:text-slate-900">{item.item_name}</td>
                      <td className="text-right number-font print:text-slate-800">{formatIDR(item.unit_price)}</td>
                      <td className="text-center number-font print:text-slate-800">{item.quantity}</td>
                      <td className="text-right number-font font-bold text-indigo-300 print:text-slate-900">
                        {formatIDR(item.sub_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ringkasan Kalkulasi Biaya & Subsidi BPJS */}
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 print:bg-slate-100 print:border-slate-300 space-y-2 text-xs">
          <div className="flex justify-between text-gray-300 print:text-slate-700">
            <span>Subtotal Tagihan Tindakan Medis:</span>
            <span className="number-font font-semibold text-white print:text-slate-900">{formatIDR(billing.total_amount)}</span>
          </div>
          <div className="flex justify-between text-cyan-400 print:text-slate-700">
            <span>Potongan / Subsidi Klaim BPJS Kesehatan:</span>
            <span className="number-font font-semibold text-cyan-300 print:text-slate-900">- {formatIDR(billing.bpjs_amount)}</span>
          </div>
          <div className="border-t border-white/10 print:border-slate-400 pt-2 flex justify-between items-center font-bold text-sm">
            <span className="text-white print:text-slate-900 uppercase">TOTAL DIBAYAR PASIEN (LUNAS):</span>
            <span className="number-font text-emerald-400 print:text-slate-900 text-base">{formatIDR(billing.patient_amount)}</span>
          </div>
        </div>

        {/* Bukti Transfer ImageKit Cloud (Jika Ada) */}
        {billing.proof_of_payment && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 print:border-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 print:text-slate-900 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-indigo-400 print:text-slate-700" /> Foto Bukti Transfer Bank (ImageKit Cloud)
              </h4>
              <a 
                href={billing.proof_of_payment} 
                target="_blank" 
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-semibold no-print"
              >
                Buka Foto Penuh <ExternalLink size={11} />
              </a>
            </div>
            <div className="rounded-lg overflow-hidden border border-white/10 print:border-slate-300 bg-black/40 print:bg-slate-100 p-2 max-h-40 flex items-center justify-center">
              <img 
                src={billing.proof_of_payment} 
                alt="Bukti Transfer ImageKit" 
                className="max-h-36 object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* Stempel & Kolom Tanda Tangan Resmi (Printed Section) */}
        <div className="pt-4 border-t border-white/10 print:border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="text-gray-400 print:text-slate-600 mb-12">Pasien / Penanggung Jawab</p>
            <p className="font-bold text-white print:text-slate-900 border-b border-dashed border-gray-600 print:border-slate-800 inline-block px-8 pb-1">
              ( {billing.patient_name || '........................'} )
            </p>
          </div>
          <div>
            <p className="text-gray-400 print:text-slate-600 mb-2">Petugas Kasir Keuangan RS</p>
            <div className="inline-block px-3 py-1 rounded border border-emerald-500/40 text-emerald-400 print:text-slate-800 print:border-slate-800 font-mono text-[10px] font-bold uppercase mb-4">
              [ VERIFIKASI RESMI - SIMRS ]
            </div>
            <br />
            <p className="font-bold text-white print:text-slate-900 border-b border-dashed border-gray-600 print:border-slate-800 inline-block px-8 pb-1">
              ( Petugas Kasir SIMRS )
            </p>
          </div>
        </div>

        {/* Footer Catatan Hak Cipta & Tombol Cetak */}
        <div className="pt-2">
          <p className="text-[10px] text-gray-500 print:text-slate-500 text-center italic">
            Bukti pembayaran ini diproses secara otomatis oleh Sistem Informasi Manajemen Rumah Sakit (SIMRS) Billing Engine dan merupakan dokumen sah.
          </p>

          <div className="flex items-center justify-between pt-4 no-print border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle size={14} className="text-emerald-400" /> Transaksi Terverifikasi Sistem SIMRS
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Tutup
              </button>
              <button type="button" onClick={handlePrint} className="btn btn-emerald btn-sm">
                <Printer size={16} /> Cetak Struk / Invoice (A4 / Cetak)
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
