<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TopupTransaction;
use App\Models\BillingLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TopupTransactionController extends Controller
{
    // 1. User merequest top-up (Generate Invoice & Kode Unik)
    public function requestTopup(Request $request)
    {
        $request->validate([
            'base_amount' => 'required|numeric|min:10000',
        ]);

        // Menggunakan akhiran 63 sesuai 2 digit terakhir NRP
        $uniqueCode = rand(1, 9) * 100 + 63; 
        $totalTransfer = $request->base_amount + $uniqueCode;

        $transaction = $request->user()->topups()->create([
            'base_amount' => $request->base_amount,
            'unique_code' => $uniqueCode,
            'total_transfer' => $totalTransfer,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Tagihan berhasil dibuat. Silakan transfer sesuai total dan upload bukti.',
            'data' => $transaction
        ], 201);
    }

    // 2. User mengupload bukti transfer QRIS
    public function uploadProof(Request $request, string $id)
    {
        $transaction = $request->user()->topups()->where('status', 'pending')->findOrFail($id);

        $request->validate([
            'proof_image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Simpan file ke storage/app/public/proofs
        $path = $request->file('proof_image')->store('proofs', 'public');

        $transaction->update([
            'proof_image' => $path,
            'status' => 'verifying', // Berubah status agar bisa dicek Admin
        ]);

        return response()->json([
            'message' => 'Bukti bayar berhasil diunggah. Menunggu verifikasi admin.',
            'data' => $transaction
        ]);
    }

    // 3. Admin melakukan verifikasi (Transaksi Kompleks untuk Demo)
    public function approve(Request $request, string $id)
    {
        // Opsional: Validasi bahwa user yang request adalah Admin (bisa via middleware nanti)
        
        DB::beginTransaction();

        try {
            // Pessimistic Locking: Mengunci baris ini selama proses berjalan agar tidak ada double-request
            $transaction = TopupTransaction::where('id', $id)
                                ->where('status', 'verifying')
                                ->lockForUpdate()
                                ->firstOrFail();

            // Ubah status transaksi
            $transaction->update(['status' => 'approved']);

            // Suntik saldo ke user terkait
            $user = $transaction->user;
            $user->wallet_balance += $transaction->total_transfer;
            $user->save();

            // Catat mutasi di buku besar (Ledger)
            BillingLedger::create([
                'user_id' => $user->id,
                'description' => 'Top Up QRIS Approved (Trans ID: ' . substr($transaction->id, 0, 8) . ')',
                'amount' => $transaction->total_transfer,
                'type' => 'credit'
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Transaksi berhasil disetujui, saldo user telah bertambah.',
                'data' => $transaction
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal memverifikasi transaksi.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reject(Request $request, string $id)
    {
        // Opsional: Validasi bahwa user yang request adalah Admin (bisa via middleware nanti)
        
        $transaction = TopupTransaction::where('id', $id)
                            ->where('status', 'verifying')
                            ->firstOrFail();

        $transaction->update(['status' => 'rejected']);

        return response()->json([
            'message' => 'Transaksi berhasil ditolak.',
            'data' => $transaction
        ]);
    }
}