import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { generateSuratNumber, fmtSuratDateRange, fmtSuratLongDate } from '@/lib/surat';
import { PrintButton } from './PrintButton';
import type { FacilityRequest } from '@/types';

export default async function SuratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const req = await queryOne<
    FacilityRequest & {
      facilityName: string;
      facilityLocation: string | null;
      facilityCategory: string;
      managingUnit: string;
      pengurusName: string;
      pengurusIdentity: string | null;
      pengurusOrg: string | null;
      pengurusLogoUrl: string | null;
    }
  >(
    `SELECT fr.*,
            f.name AS facilityName, f.location AS facilityLocation,
            f.category AS facilityCategory, f.managingUnit,
            u.name AS pengurusName, u.identityNumber AS pengurusIdentity,
            u.organizationName AS pengurusOrg, u.organizationLogoUrl AS pengurusLogoUrl
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     JOIN users u ON u.id = fr.userId
     WHERE fr.id = ?`,
    [Number(id)]
  );
  if (!req) notFound();

  if (
    user.role === 'PENGURUS' && req.userId !== user.id
  ) {
    redirect('/dashboard');
  }
  if (req.status !== 'APPROVED' && req.status !== 'WAITING_ADMIN_UNIT') {
    redirect(`/dashboard/pengurus/requests/${req.id}`);
  }

  const biroIII = await queryOne<{ name: string; identityNumber: string | null }>(
    `SELECT u.name, u.identityNumber FROM approval_logs al
     JOIN users u ON u.id = al.actorId
     WHERE al.requestId = ? AND al.action = 'APPROVE_BIRO_III'
     ORDER BY al.id DESC LIMIT 1`,
    [req.id]
  );
  const wr3 = await queryOne<{ name: string; identityNumber: string | null }>(
    `SELECT u.name, u.identityNumber FROM approval_logs al
     JOIN users u ON u.id = al.actorId
     WHERE al.requestId = ? AND al.action = 'APPROVE_WR3_WD3'
     ORDER BY al.id DESC LIMIT 1`,
    [req.id]
  );

  const suratNo = generateSuratNumber(req.id, req.createdAt);
  const today = fmtSuratLongDate(new Date());
  const jadwal = fmtSuratDateRange(req.startDateTime, req.endDateTime);

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
            <p style={{ fontSize: '10pt', margin: '2px 0 0' }}>Sekretariat: Gedung Bundar Atrium Didaktos</p>
            <p style={{ fontSize: '10pt', margin: '2px 0 0' }}>Email: bpm.ukdw@students.ukdw.ac.id</p>
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
              <td>{suratNo}</td>
              <td style={{ textAlign: 'right' }}>Yogyakarta, {today}</td>
            </tr>
            <tr>
              <td>Hal</td>
              <td>:</td>
              <td colSpan={2}>Permohonan Peminjaman Fasilitas</td>
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
          <p style={{ margin: 0, fontWeight: 600 }}>Pengelola Fasilitas — {req.managingUnit.replace('_', ' ')}</p>
          <p style={{ margin: 0 }}>Universitas Kristen Duta Wacana</p>
          <p style={{ margin: 0 }}>di Tempat</p>
        </div>

        <p style={{ margin: '0 0 12px' }}>Dengan Hormat,</p>

        <p style={{ textAlign: 'justify', margin: '0 0 12px', textIndent: 32 }}>
          Melalui surat ini, kami selaku panitia <strong>{req.activityName}</strong> dari{' '}
          <strong>{req.organizationName}</strong> memohon izin untuk melakukan peminjaman fasilitas guna
          mendukung pelaksanaan kegiatan tersebut. Adapun rincian peminjaman sebagai berikut:
        </p>

        <table style={{ width: '100%', marginBottom: 12, fontSize: '12pt' }}>
          <tbody>
            <tr>
              <td style={{ width: 140, verticalAlign: 'top' }}>Hari / Tanggal</td>
              <td style={{ width: 14, verticalAlign: 'top' }}>:</td>
              <td>{jadwal}</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top' }}>Fasilitas</td>
              <td style={{ verticalAlign: 'top' }}>:</td>
              <td>
                {req.facilityName}
                {req.facilityLocation ? ` (${req.facilityLocation})` : ''}
              </td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top' }}>Tujuan</td>
              <td style={{ verticalAlign: 'top' }}>:</td>
              <td>{req.purpose}</td>
            </tr>
            <tr>
              <td style={{ verticalAlign: 'top' }}>Deskripsi</td>
              <td style={{ verticalAlign: 'top' }}>:</td>
              <td>{req.description}</td>
            </tr>
            {req.participantCount != null && (
              <tr>
                <td style={{ verticalAlign: 'top' }}>Jumlah Peserta</td>
                <td style={{ verticalAlign: 'top' }}>:</td>
                <td>± {req.participantCount} orang</td>
              </tr>
            )}
            {req.additionalNeeds && (
              <tr>
                <td style={{ verticalAlign: 'top' }}>Kebutuhan Tambahan</td>
                <td style={{ verticalAlign: 'top' }}>:</td>
                <td>{req.additionalNeeds}</td>
              </tr>
            )}
            <tr>
              <td style={{ verticalAlign: 'top' }}>Narahubung</td>
              <td style={{ verticalAlign: 'top' }}>:</td>
              <td>
                {req.personInCharge} ({req.phone})
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ textAlign: 'justify', margin: '0 0 36px', textIndent: 32 }}>
          Demikian surat ini kami sampaikan. Atas perhatian dan bantuan Bapak/Ibu kami ucapkan terima kasih.
        </p>

        <table style={{ width: '100%', marginBottom: 24 }}>
          <tbody>
            <tr style={{ verticalAlign: 'top' }}>
              <td style={{ width: '50%', textAlign: 'center' }}>
                <p style={{ margin: 0 }}>Hormat kami,</p>
                <p style={{ margin: 0, fontWeight: 600 }}>Pengurus LK/OK</p>
                <div style={{ height: 80 }} />
                <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>
                  {req.pengurusName}
                </p>
                {req.pengurusIdentity && <p style={{ margin: 0 }}>NIM: {req.pengurusIdentity}</p>}
                {req.pengurusOrg && <p style={{ margin: 0, fontSize: '11pt' }}>{req.pengurusOrg}</p>}
              </td>
              <td style={{ width: '50%', textAlign: 'center' }}>
                <p style={{ margin: 0 }}>Menyetujui,</p>
                <p style={{ margin: 0, fontWeight: 600 }}>Biro III Kemahasiswaan</p>
                <div style={{ height: 80 }} />
                <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>
                  {biroIII?.name ?? '-'}
                </p>
                <p style={{ margin: 0, fontSize: '11pt' }}>Biro III</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <p style={{ margin: 0 }}>Mengetahui,</p>
          <p style={{ margin: 0, fontWeight: 600 }}>Wakil Rektor III / Wakil Dekan III</p>
          <p style={{ margin: 0, fontSize: '11pt' }}>Bidang Kemahasiswaan</p>
          <div style={{ height: 80 }} />
          <p style={{ margin: 0, fontWeight: 700, textDecoration: 'underline' }}>{wr3?.name ?? '-'}</p>
          <p style={{ margin: 0, fontSize: '11pt' }}>WR3 / WD3</p>
        </div>
      </div>
    </div>
  );
}
