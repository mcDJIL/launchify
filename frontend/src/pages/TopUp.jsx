import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import AppLayout from '../components/AppLayout';
import qris from '/qris-mcdjil.jpeg'

export default function TopUp() {
  const [step, setStep] = useState(1);
  const [baseAmount, setBaseAmount] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Request pembuatan tagihan dengan kode unik
  const handleRequestTopup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/topup/request', { base_amount: baseAmount });
      setTransaction(res.data.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat tagihan. Minimal Rp 10.000.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Upload file bukti transfer
  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      setError('Pilih file bukti gambar terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // Karena mengirim file, kita harus menggunakan FormData
    const formData = new FormData();
    formData.append('proof_image', proofFile);

    try {
      await api.post(`/topup/${transaction.id}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah bukti transfer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout active="topup" width="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Top-up saldo</h1>
          <p className="mt-2 text-muted">Transfer lewat QRIS, lalu unggah bukti. Saldo bertambah setelah admin memverifikasi.</p>
        </div>
      </div>

            <ol aria-label="Langkah top-up" className="mt-8 grid grid-cols-3 gap-3">
              <StepIndicator current={step} stepNum={1} text="Input nominal" />
              <StepIndicator current={step} stepNum={2} text="Pembayaran" />
              <StepIndicator current={step} stepNum={3} text="Verifikasi" />
            </ol>

            <div className="card mt-6 p-6 md:p-8">
              {error && (
                <div role="alert" className="mb-6 rounded-xl border-2 border-danger p-4 text-sm font-semibold text-danger">
                  {error}
                </div>
              )}

              {/* STEP 1: INPUT NOMINAL */}
              {step === 1 && (
                <form onSubmit={handleRequestTopup} className="space-y-6">
                  <div>
                    <label htmlFor="topup-amount" className="mb-2 block text-sm font-semibold">
                      Nominal top-up (minimal Rp 5.000)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-muted">Rp</span>
                      <input
                        id="topup-amount"
                        type="number"
                        min="5000"
                        required
                        className="field pl-12 text-lg font-semibold"
                        value={baseAmount}
                        onChange={(e) => setBaseAmount(e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Sistem menambahkan 3 digit kode unik di akhir nominal agar transfermu mudah dicocokkan.
                    </p>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-lg">
                    {loading ? 'Memproses...' : 'Buat tagihan QRIS'}
                  </button>
                </form>
              )}

              {/* STEP 2: SCAN QRIS & UPLOAD BUKTI */}
              {step === 2 && transaction && (
                <form onSubmit={handleUploadProof} className="space-y-8">
                  <div className="flex flex-col items-center text-center">
                    <img src={qris} alt="Kode QRIS untuk pembayaran" className="h-56 w-56 rounded-xl border-2 border-ink bg-white object-contain" />
                    <p className="mt-6 text-sm text-muted">Transfer tepat sebesar</p>
                    <p className="font-display text-4xl font-extrabold tabular-nums">
                      Rp {parseFloat(transaction.total_transfer).toLocaleString('id-ID')}
                    </p>
                    <p className="mt-3 max-w-md text-sm font-semibold text-danger">
                      Jangan dibulatkan. Pastikan 3 digit terakhir sama dengan nominal di atas.
                    </p>
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold">Bukti transfer (screenshot)</span>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink bg-paper p-6 text-center hover:bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
                      <span className="font-semibold">{proofFile ? proofFile.name : 'Pilih gambar .jpg atau .png'}</span>
                      <span className="text-sm text-muted">Tap untuk memilih file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/jpeg, image/png, image/jpg"
                        onChange={(e) => setProofFile(e.target.files[0])}
                      />
                    </label>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-lg">
                    {loading ? 'Mengunggah...' : <><UploadCloud className="h-5 w-5" /> Kirim bukti pembayaran</>}
                  </button>
                </form>
              )}

              {/* STEP 3: SUCCESS WAITING STATE */}
              {step === 3 && (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-ink bg-accent text-on-accent">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="font-display text-3xl font-extrabold">Bukti terkirim.</h2>
                  <p className="mx-auto mt-3 max-w-sm text-muted">
                    Transaksi Rp {parseFloat(transaction?.total_transfer).toLocaleString('id-ID')} sedang diverifikasi admin. Saldo bertambah otomatis setelah disetujui.
                  </p>
                  <Link to="/dashboard" className="btn-secondary mt-8 px-6 py-3">
                    Kembali ke dashboard
                  </Link>
                </div>
              )}
            </div>
    </AppLayout>
  );
}

// Sub-component untuk indikator step
function StepIndicator({ current, stepNum, text }) {
  const active = current >= stepNum;
  return (
    <li className={`rounded-xl border-2 p-3 ${active ? 'border-ink bg-ink text-paper' : 'border-hair text-muted'}`}>
      <span className="font-display text-sm font-bold tabular-nums">0{stepNum}</span>
      <p className="mt-1 text-sm font-semibold">{text}</p>
    </li>
  );
}
