import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { generateSuratNumber, fmtSuratDateRange, fmtSuratLongDate } from '@/lib/surat';
import { PrintButton } from './PrintButton';
import { MANAGING_UNIT_HEAD, type ManagingUnit, type FacilityRequest } from '@/types';

export default async function SuratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const req = await queryOne<
    FacilityRequest & {
      facilityName: string;
      facilityLocation: string | null;
      facilityCategory: string;
      facilityCapacity: number | null;
      managingUnit: ManagingUnit;
      pengurusName: string;
      pengurusIdentity: string | null;
      pengurusOrg: string | null;
      pengurusLogoUrl: string | null;
      pengurusSignatureUrl: string | null;
    }
  >(
    `SELECT fr.*,
            f.name AS facilityName, f.location AS facilityLocation,
            f.category AS facilityCategory, f.capacity AS facilityCapacity,
            f.managingUnit,
            u.name AS pengurusName, u.identityNumber AS pengurusIdentity,
            u.organizationName AS pengurusOrg, u.organizationLogoUrl AS pengurusLogoUrl,
            u.signatureUrl AS pengurusSignatureUrl
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     JOIN users u ON u.id = fr.userId
     WHERE fr.id = ?`,
    [Number(id)]
  );
  if (!req) notFound();

  if (user.role === 'PENGURUS' && req.userId !== user.id) {
    redirect('/dashboard');
  }
  if (req.status !== 'APPROVED' && req.status !== 'WAITING_ADMIN_UNIT') {
    redirect(`/dashboard/pengurus/requests/${req.id}`);
  }

  const biroIII = await queryOne<{ name: string; identityNumber: string | null; signatureUrl: string | null }>(
    `SELECT u.name, u.identityNumber, u.signatureUrl FROM approval_logs al
     JOIN users u ON u.id = al.actorId
     WHERE al.requestId = ? AND al.action = 'APPROVE_BIRO_III'
     ORDER BY al.id DESC LIMIT 1`,
    [req.id]
  );
  const wr3 = await queryOne<{ name: string; identityNumber: string | null; signatureUrl: string | null }>(
    `SELECT u.name, u.identityNumber, u.signatureUrl FROM approval_logs al
     JOIN users u ON u.id = al.actorId
     WHERE al.requestId = ? AND al.action = 'APPROVE_WR3_WD3'
     ORDER BY al.id DESC LIMIT 1`,
    [req.id]
  );

  const suratNo = generateSuratNumber(req.id, req.createdAt);
  const today = fmtSuratLongDate(new Date());
  const jadwal = fmtSuratDateRange(req.startDateTime, req.endDateTime);
  const halKategori = halKategoriFor(req.facilityCategory);
  const kepadaTujuan = MANAGING_UNIT_HEAD[req.managingUnit];
  const kebutuhanItems = buildKebutuhanItems(req.facilityName, req.facilityLocation, req.facilityCapacity, req.additionalNeeds);

  return (
    <div className="surat-page">
      <div className="surat-toolbar">
        <Link href={`/dashboard/pengurus/requests/${req.id}`} className="surat-btn-secondary">← Kembali</Link>
        <PrintButton />
      </div>

      <div className="surat-paper">
        <header style={{ borderBottom: '3px double #000', paddingBottom: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src="/ukdw.png"
            alt="Logo UKDW"
            style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: '14pt', fontWeight: 700, letterSpacing: 1, margin: 0 }}>
              {(req.pengurusOrg || 'BADAN PERWAKILAN MAHASISWA').toUpperCase()}
            </p>
            <p style={{ fontSize: '13pt', fontWeight: 700, margin: '4px 0 0' }}>UNIVERSITAS KRISTEN DUTA WACANA</p>
            <p style={{ fontSize: '10pt', margin: '6px 0 0' }}>Jl. Dr. Wahidin Sudirohusodo No. 5-24 Yogyakarta 55224</p>
          </div>
          <div style={{ width: 80, height: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {req.pengurusLogoUrl ? (
              <img
                src={req.pengurusLogoUrl}
                alt="Logo Organisasi"
                style={{ maxWidth: 80, maxHeight: 80, objectFit: 'contain' }}
              />
            ) : null}
          </div>
        </header>

        <table style={{ width: '100%', marginBottom: 16, fontSize: '12pt' }}>
          <tbody>
            <tr>
              <td style={{ width: 80 }}>Nomor</td>
              <td style={{ width: 14 }}>:</td>
              <td style={{ fontWeight: 700 }}>{suratNo}</td>
              <td style={{ textAlign: 'right' }}>Yogyakarta, {today}</td>
            </tr>
            <tr>
              <td>Hal</td>
              <td>:</td>
              <td colSpan={2}>Permohonan Peminjaman {halKategori}</td>
            </tr>
            <tr>
              <td>Lampiran</td>
              <td>:</td>
              <td colSpan={2}>-</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: 0 }}>Kepada Yth.</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{kepadaTujuan}</p>
          <p style={{ margin: 0 }}>Universitas Kristen Duta Wacana</p>
          <p style={{ margin: 0 }}>di Tempat</p>
        </div>

        <p style={{ margin: '0 0 12px' }}>Dengan Hormat,</p>

        <p style={{ textAlign: 'justify', margin: '0 0 12px', textIndent: 32 }}>
          Melalui surat ini, kami selaku pengurus <strong>{req.organizationName}</strong> meminta izin untuk
          melakukan peminjaman {halKategori.toLowerCase()} untuk keperluan{' '}
          <strong>{req.purpose}</strong> dalam kegiatan <strong>{req.activityName}</strong>. Adapun rincian
          peminjaman sebagai berikut:
        </p>

        <table style={{ width: '100%', marginBottom: 12, fontSize: '12pt' }}>
          <tbody>
            <tr>
              <td style={{ width: 140, verticalAlign: 'top' }}>Hari / Tanggal</td>
              <td style={{ width: 14, verticalAlign: 'top' }}>:</td>
              <td>{jadwal}</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top' }}>Kebutuhan, jumlah</td>
              <td style={{ verticalAlign: 'top' }}>:</td>
              <td>
                {kebutuhanItems.length === 1 ? (
                  <span>{kebutuhanItems[0]}</span>
                ) : (
                  <ol style={{ margin: 0, paddingLeft: 22 }}>
                    {kebutuhanItems.map((item, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{item}</li>
                    ))}
                  </ol>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top' }}>Narahubung</td>
              <td style={{ verticalAlign: 'top' }}>:</td>
              <td>
                {req.phone} ({req.personInCharge})
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ textAlign: 'justify', margin: '0 0 28px', textIndent: 0 }}>
          Demikian surat ini kami sampaikan. Atas perhatian dan bantuan Bapak/Ibu kami ucapkan terima kasih.
        </p>

        {/* Pengurus signature — centered */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ width: '60%', textAlign: 'center' }}>
            <p style={{ margin: 0 }}>Hormat kami,</p>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Penanggung Jawab {req.activityName}
            </p>
            <SignatureBlock url={req.pengurusSignatureUrl} />
            <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>
              {req.pengurusName}
            </p>
            {req.pengurusIdentity && <p style={{ margin: 0 }}>NIM: {req.pengurusIdentity}</p>}
          </div>
        </div>

        <p style={{ textAlign: 'center', margin: '0 0 28px' }}>Mengetahui,</p>

        {/* Approvers — 2 columns */}
        <table style={{ width: '100%' }}>
          <tbody>
            <tr style={{ verticalAlign: 'top' }}>
              <td style={{ width: '50%', textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Wakil Rektor III</p>
                <p style={{ margin: 0, fontSize: '11pt', whiteSpace: 'nowrap' }}>Bidang Kemahasiswaan, Alumni, Informasi, dan Inovasi</p>
                <SignatureBlock url={wr3?.signatureUrl ?? null} />
                <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>{wr3?.name ?? '-'}</p>
              </td>
              <td style={{ width: '50%', textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Kepala Biro III UKDW</p>
                <p style={{ margin: 0, fontSize: '11pt' }}>Kemahasiswaan</p>
                <SignatureBlock url={biroIII?.signatureUrl ?? null} />
                <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>{biroIII?.name ?? '-'}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SignatureBlock({ url }: { url: string | null }) {
  if (url) {
    return (
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={url}
          alt="Tanda tangan"
          style={{ maxHeight: 76, maxWidth: 180, objectFit: 'contain' }}
        />
      </div>
    );
  }
  return <div style={{ height: 80 }} />;
}

function halKategoriFor(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('peralatan')) return 'Peralatan';
  if (c.includes('kendaraan')) return 'Kendaraan';
  if (c.includes('lapangan')) return 'Lapangan';
  if (c.includes('lab')) return 'Laboratorium';
  if (c.includes('studio')) return 'Studio';
  if (c.includes('aula') || c.includes('auditorium')) return 'Aula';
  if (c.includes('ruang')) return 'Ruangan';
  return 'Fasilitas';
}

function buildKebutuhanItems(
  facilityName: string,
  location: string | null,
  capacity: number | null,
  additionalNeeds: string | null
): string[] {
  const main = `${facilityName}${location ? ` — ${location}` : ''}${capacity ? `, kap. ${capacity}` : ''}, 1 buah`;
  const items: string[] = [main];
  if (additionalNeeds && additionalNeeds.trim()) {
    const lines = additionalNeeds
      .split(/\r?\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    items.push(...lines);
  }
  return items;
}
