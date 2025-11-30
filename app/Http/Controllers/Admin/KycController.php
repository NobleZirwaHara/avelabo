<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seller;
use App\Models\SellerKyc;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class KycController extends Controller
{
    /**
     * Display list of KYC applications
     */
    public function index(Request $request)
    {
        $kycs = SellerKyc::with(['seller:id,shop_name,user_id', 'seller.user:id,name,email'])
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->when($request->search, function ($query, $search) {
                $query->whereHas('seller', function ($q) use ($search) {
                    $q->where('shop_name', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($u) use ($search) {
                            $u->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('submitted_at')
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'pending' => SellerKyc::where('status', 'pending')->count(),
            'approved' => SellerKyc::where('status', 'approved')->count(),
            'rejected' => SellerKyc::where('status', 'rejected')->count(),
        ];

        return Inertia::render('Admin/Kyc/Index', [
            'kycApplications' => $kycs,
            'filters' => [
                'status' => $request->status,
                'search' => $request->search,
                'counts' => [
                    'all' => SellerKyc::count(),
                    'pending' => $stats['pending'],
                    'approved' => $stats['approved'],
                    'rejected' => $stats['rejected'],
                    'under_review' => SellerKyc::where('status', 'under_review')->count(),
                ],
            ],
        ]);
    }

    /**
     * Show single KYC application for review
     */
    public function show(SellerKyc $kyc)
    {
        $kyc->load([
            'seller:id,shop_name,description,business_type,business_name,business_registration_number,status,created_at',
            'seller.user:id,name,email,phone,created_at',
            'reviewer:id,name',
        ]);

        // Build document URLs - handle case where private disk doesn't support temporary URLs
        $documentUrls = [
            'id_front' => null,
            'id_back' => null,
            'selfie' => null,
            'business_registration' => null,
        ];

        try {
            if ($kyc->id_front_path) {
                $documentUrls['id_front'] = Storage::disk('private')->url($kyc->id_front_path);
            }
            if ($kyc->id_back_path) {
                $documentUrls['id_back'] = Storage::disk('private')->url($kyc->id_back_path);
            }
            if ($kyc->selfie_path) {
                $documentUrls['selfie'] = Storage::disk('private')->url($kyc->selfie_path);
            }
            if ($kyc->business_registration_path) {
                $documentUrls['business_registration'] = Storage::disk('private')->url($kyc->business_registration_path);
            }
        } catch (\Exception $e) {
            // Fallback for development - just use the paths
        }

        return Inertia::render('Admin/Kyc/Show', [
            'kyc' => $kyc,
            'seller' => $kyc->seller,
            'documentUrls' => $documentUrls,
        ]);
    }

    /**
     * Approve KYC application
     */
    public function approve(Request $request, SellerKyc $kyc)
    {
        if (!in_array($kyc->status, ['pending', 'under_review'])) {
            return back()->with('error', 'This KYC application has already been processed.');
        }

        $kyc->update([
            'status' => 'approved',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        // Update seller status to active
        $kyc->seller->update([
            'status' => 'active',
            'is_verified' => true,
            'approved_at' => now(),
        ]);

        // TODO: Send approval email to seller

        return redirect()->route('admin.kyc.index')
            ->with('success', "Seller '{$kyc->seller->shop_name}' has been approved!");
    }

    /**
     * Reject KYC application
     */
    public function reject(Request $request, SellerKyc $kyc)
    {
        if (!in_array($kyc->status, ['pending', 'under_review'])) {
            return back()->with('error', 'This KYC application has already been processed.');
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $kyc->update([
            'status' => 'rejected',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        // Keep seller in pending status so they can resubmit
        $kyc->seller->update([
            'status' => 'pending',
        ]);

        // TODO: Send rejection email to seller with reason

        return redirect()->route('admin.kyc.index')
            ->with('success', "KYC application for '{$kyc->seller->shop_name}' has been rejected.");
    }

    /**
     * Request additional documents
     */
    public function requestDocuments(Request $request, SellerKyc $kyc)
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $kyc->update([
            'status' => 'under_review',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        // Keep seller in pending status
        $kyc->seller->update([
            'status' => 'pending',
        ]);

        // TODO: Send email requesting additional documents

        return back()->with('success', 'Request for additional documents has been sent.');
    }
}
