export const printFinancialReportPDF = (data, monthName, year, ledgers = [], formatIDR) => {
  if (!data) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const topActionsRows = (data.top_actions || []).map((act, idx) => `
    <tr>
      <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 8px; font-family: monospace;">${idx + 1}</td>
      <td style="font-weight: 600; border: 1px solid #cbd5e1; padding: 6px 8px;">${act.item_name}</td>
      <td style="text-align: center; font-family: monospace; border: 1px solid #cbd5e1; padding: 6px 8px;">${act.total_qty} kali</td>
      <td style="text-align: right; font-family: monospace; font-weight: 700; border: 1px solid #cbd5e1; padding: 6px 8px;">${formatIDR(act.total_amount)}</td>
    </tr>
  `).join('');

  const ledgerRows = ledgers.slice(0, 10).map((l, idx) => `
    <tr>
      <td style="font-family: monospace; font-size: 10px; border: 1px solid #cbd5e1; padding: 6px 8px;">#LEDGER-${l.ID || l.id}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${l.description}</td>
      <td style="text-align: center; font-size: 10px; font-weight: 700; border: 1px solid #cbd5e1; padding: 6px 8px; color: #16a34a;">${l.entry_type}</td>
      <td style="text-align: right; font-family: monospace; font-weight: 700; border: 1px solid #cbd5e1; padding: 6px 8px;">${formatIDR(l.amount)}</td>
    </tr>
  `).join('');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Laporan Keuangan SIMRS - ${monthName} ${year}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; background: #ffffff; padding: 10px; font-size: 11px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8px; border-bottom: 2px solid #0f172a; margin-bottom: 12px; }
          .title { font-size: 17px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }
          .sub { font-size: 10px; color: #475569; }
          .doc-title { text-align: center; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 12px; }
          .meta-item { text-align: center; }
          .meta-label { font-size: 9.5px; color: #64748b; display: block; text-transform: uppercase; font-weight: 600; }
          .meta-val { font-size: 12px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
          th { background-color: #f1f5f9; color: #0f172a; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 6px 8px; border: 1px solid #94a3b8; text-align: left; }
          td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a; }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin-bottom: 6px; margin-top: 10px; }
          .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center; margin-top: 30px; margin-bottom: 10px; }
          .signature-name { font-size: 10px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #64748b; display: inline-block; padding: 0 16px 2px 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">RUMAH SAKIT UTAMA SIMRS</div>
            <div class="sub">Laporan Akuntansi Keuangan & Audit Penerimaan Kas Medis</div>
            <div class="sub">Jl. Kesehatan No. 45, Jakarta Pusat 10110 • Telp: (021) 555-0199</div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 11px; font-weight: 700;">PERIODE LAPORAN</div>
            <div style="font-family: monospace; font-size: 10px; color: #16a34a; font-weight: 700;">${monthName} ${year}</div>
          </div>
        </div>

        <div class="doc-title">RINGKASAN EXECUTIVE LAPORAN PENDAPATAN & KLAIM BPJS</div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Kas Hari Ini</span>
            <span class="meta-val">${formatIDR(data.periods?.daily_revenue)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">7 Hari Terakhir</span>
            <span class="meta-val">${formatIDR(data.periods?.weekly_revenue)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Kas Bulan Ini</span>
            <span class="meta-val">${formatIDR(data.periods?.monthly_revenue)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Total Kas Lunas</span>
            <span class="meta-val">${formatIDR(data.periods?.total_revenue)}</span>
          </div>
        </div>

        <div class="section-title">Peringkat 5 Tindakan Medis Terlaris</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">No</th>
              <th>Nama Tindakan / Layanan Medis</th>
              <th style="text-align: center;">Total Kuantitas</th>
              <th style="text-align: right;">Total Omzet (IDR)</th>
            </tr>
          </thead>
          <tbody>
            ${topActionsRows}
          </tbody>
        </table>

        <div class="section-title">Mutasi Jurnal Kas Masuk Terakhir</div>
        <table>
          <thead>
            <tr>
              <th>ID Mutasi</th>
              <th>Deskripsi Transaksi</th>
              <th style="text-align: center;">Jenis</th>
              <th style="text-align: right;">Nominal (IDR)</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerRows}
          </tbody>
        </table>

        <div class="signature-grid">
          <div>
            <div style="font-size: 10px; color: #475569; margin-bottom: 30px;">Staf Akuntansi & Finance</div>
            <div class="signature-name">( Petugas Keuangan RS )</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #475569; margin-bottom: 30px;">Kepala Divisi Keuangan SIMRS</div>
            <div class="signature-name">( Ka. Divisi Akuntansi )</div>
          </div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 300);
};
