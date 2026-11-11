import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, LogOut, UploadCloud, CheckCircle2, Server, QrCode, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';
import qris from '/qris-mcdjil.jpeg'

export default function TopUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [baseAmount, setBaseAmount] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    await api.post('/logout');
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

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
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Server className="w-6 h-6" /> SudoPaaS
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition font-medium">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link to="/topup" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg transition font-medium">
            <Wallet className="w-5 h-5" /> Top-Up Saldo
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-red-500 hover:text-red-700 font-medium w-full transition">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-gray-900">Top-Up Wallet</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              U
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN AREA */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            
            {/* Indikator Step */}
            <div className="flex items-center justify-between mb-10 border-b pb-6">
              <StepIndicator current={step} stepNum={1} text="Input Nominal" />
              <div className={`flex-1 h-1 mx-4 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <StepIndicator current={step} stepNum={2} text="Pembayaran" />
              <div className={`flex-1 h-1 mx-4 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <StepIndicator current={step} stepNum={3} text="Verifikasi" />
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>}

            {/* STEP 1: INPUT NOMINAL */}
            {step === 1 && (
              <form onSubmit={handleRequestTopup}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nominal Top-Up (Minimal Rp 10.000)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-semibold">Rp</span>
                    <input 
                      type="number" 
                      min="10000"
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg font-medium"
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    *Sistem akan menambahkan 3 digit kode unik di akhir nominal.
                  </p>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-70">
                  {loading ? 'Memproses...' : 'Buat Tagihan QRIS'}
                </button>
              </form>
            )}

            {/* STEP 2: SCAN QRIS & UPLOAD BUKTI */}
            {step === 2 && transaction && (
              <form onSubmit={handleUploadProof} className="text-center">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 inline-block mb-6">
                  <img src={qris} className="w-48 h-48 text-gray-800 mx-auto" />
                  {/* Ganti ikon QrCode di atas dengan tag <img src="/qris-kamu.jpg" /> jika sudah ada file QRIS aslinya */}
                </div>
                
                <h3 className="text-lg text-gray-600 mb-1">Transfer Tepat Sebesar:</h3>
                <div className="text-4xl font-extrabold text-blue-700 mb-2">
                  Rp {parseFloat(transaction.total_transfer).toLocaleString('id-ID')}
                </div>
                <p className="text-sm text-red-500 font-semibold mb-8">
                  PENTING: Jangan bulatkan nominal! Pastikan angka sesuai hingga 3 digit terakhir.
                </p>

                <div className="text-left mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Bukti Transfer (Screenshot)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">
                        {proofFile ? proofFile.name : 'Klik untuk memilih gambar (.jpg / .png)'}
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/jpeg, image/png, image/jpg"
                      onChange={(e) => setProofFile(e.target.files[0])}
                    />
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center gap-2">
                  {loading ? 'Mengunggah...' : <><UploadCloud className="w-5 h-5"/> Kirim Bukti Pembayaran</>}
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS WAITING STATE */}
            {step === 3 && (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bukti Terkirim!</h2>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                  Transaksi dengan nominal Rp {parseFloat(transaction?.total_transfer).toLocaleString('id-ID')} sedang diverifikasi oleh admin. Saldo akan otomatis bertambah setelah disetujui.
                </p>
                <Link to="/dashboard" className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition">
                  Kembali ke Dashboard
                </Link>
              </div>
            )}

          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-gray-200 py-4 px-8 text-center md:text-left text-sm text-gray-500">
          &copy; 2026 SudoPaaS Engine - Developed by mcDJIL.
        </footer>

      </div>
    </div>
  );
}

// Sub-component untuk indikator step
function StepIndicator({ current, stepNum, text }) {
  const active = current >= stepNum;
  return (
    <div className="flex flex-col items-center gap-2 w-24">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
      }`}>
        {stepNum}
      </div>
      <span className={`text-xs font-semibold text-center ${active ? 'text-blue-700' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  );
}