import { Link } from 'react-router-dom';
import { Rocket, Wallet, FolderGit2, Terminal, Zap, Server } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-bold text-blue-700 flex items-center gap-2">
            <Server className="w-8 h-8" />
            Launchify
          </div>
          
          {/* Link Section Navigation (Disembunyikan di layar HP) */}
          <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-600">
            <a href="#fitur" className="hover:text-blue-600 transition">Fitur</a>
            <a href="#cara-kerja" className="hover:text-blue-600 transition">Cara Kerja</a>
            <a href="#harga" className="hover:text-blue-600 transition">Harga</a>
          </div>

          <div className="flex gap-4">
            <Link to="/login" className="px-5 py-2 text-gray-600 font-medium hover:text-blue-600 transition hidden sm:block">
              Masuk
            </Link>
            <Link to="/register" className="px-5 py-2 bg-blue-600 text-white font-medium rounded-full shadow-md hover:bg-blue-700 transition">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-36 pb-32 px-8 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-white"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6 border border-blue-100">
            <Zap className="w-4 h-4" /> Solusi Hosting Praktikum & Tugas Akhir
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Deploy Aplikasi Web Kamu <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Tanpa Kartu Kredit.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Cloud hosting khusus mahasiswa. Hubungkan repositori GitHub, isi saldo pakai QRIS ShopeePay, dan biarkan sistem kami merakit Docker-nya untukmu secara otomatis.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              <Rocket className="w-5 h-5" /> Mulai Deploy Sekarang
            </Link>
            <a href="#cara-kerja" className="px-8 py-4 bg-white text-gray-700 border border-gray-200 font-semibold rounded-lg hover:bg-gray-50 transition-all">
              Lihat Cara Kerja
            </a>
          </div>
        </div>
      </section>

      {/* 3. Features Section (Ditambahkan ID 'fitur') */}
      <section id="fitur" className="py-24 bg-gray-50 px-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kenapa Memilih Kami?</h2>
            <p className="text-gray-600">Didesain khusus untuk menyelesaikan pain-points mahasiswa IT.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Wallet className="w-8 h-8 text-blue-600" />}
              title="Bayar Pakai QRIS"
              desc="Gak perlu pinjam kartu kredit orang tua. Top-up saldo pakai ShopeePay, GoPay, atau m-Banking mulai dari Rp 10.000."
            />
            <FeatureCard 
              icon={<Terminal className="w-8 h-8 text-indigo-600" />}
              title="Pay-As-You-Go"
              desc="Sistem tagihan per jam. Kalau tugas atau demo praktikum sudah selesai, matikan servernya agar saldo berhenti terpotong."
            />
            <FeatureCard 
              icon={<FolderGit2 className="w-8 h-8 text-gray-800" />}
              title="Auto-Build dari GitHub"
              desc="Tinggal masukkan URL repositori. Kami otomatis menjalankan environment Docker dan memberikan URL aktif."
            />
          </div>
        </div>
      </section>

      {/* 4. Cara Kerja Section */}
      <section id="cara-kerja" className="py-24 px-8 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Tiga Langkah Menuju Production</h2>
            <div className="space-y-6">
              <StepItem number="1" title="Top-Up Dompet" desc="Scan QRIS, upload bukti bayar, dan saldo langsung masuk." />
              <StepItem number="2" title="Daftarkan Project" desc="Pilih spesifikasi RAM & CPU, lalu tempelkan link GitHub (Express, Laravel, Vite, dll)." />
              <StepItem number="3" title="Klik Deploy" desc="Tunggu beberapa detik, aplikasi web-mu langsung live dan siap didemokan ke dosen." />
            </div>
          </div>
          <div className="md:w-1/2 bg-slate-900 rounded-2xl p-6 shadow-2xl w-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-400 ml-2 font-mono">deployment-log.sh</span>
            </div>
            <pre className="text-green-400 font-mono text-sm overflow-hidden whitespace-pre-wrap">
              {`> git clone https://github.com/...
> Building Docker image...
> SUCCESS: Image built in 14.2s
> Starting container...
> Application is LIVE at port 8000
> Status: Active
> Hourly rate: Rp 150/jam applied.`}
            </pre>
          </div>
        </div>
      </section>

      {/* 5. Pricing Preview & CTA (Ditambahkan ID 'harga') */}
      <section id="harga" className="py-24 px-8 bg-blue-600 text-white text-center scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Mulai dari Rp 150 Perak per Jam</h2>
          <p className="text-blue-100 text-lg mb-10">
            Jauh lebih murah dari jajan di kantin. Bayar hanya selama server menyala.
          </p>
          <Link to="/register" className="px-8 py-4 bg-white text-blue-700 font-bold rounded-lg shadow hover:bg-gray-50 transition-all inline-block">
            Buat Akun Sekarang
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© 2026 SudoPaaS. Dibangun untuk Projek UAS Pemrograman Framework.</p>
      </footer>
    </div>
  );
}

// Sub-components
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepItem({ number, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border-4 border-white shadow">
        {number}
      </div>
      <div>
        <h4 className="text-xl font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-600">{desc}</p>
      </div>
    </div>
  );
}
