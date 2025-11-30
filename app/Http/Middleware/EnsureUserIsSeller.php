<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSeller
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Check if user has a seller account
        if (!$user->seller) {
            return redirect()->route('seller.register');
        }

        // Check if seller is active (allow access to status page if not active)
        if ($user->seller->status !== 'active') {
            $allowedRoutes = ['seller.kyc.create', 'seller.kyc.store', 'seller.kyc.status'];

            if (!in_array($request->route()->getName(), $allowedRoutes)) {
                return redirect()->route('seller.kyc.status');
            }
        }

        return $next($request);
    }
}
