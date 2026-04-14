export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - PayPal Style Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#003087] via-[#004095] to-[#0050b3] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#009CDE]/10" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#FFC439]/10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white tracking-tight">ClinixGlow</span>
            <span className="text-white/70 text-lg">&</span>
            <span className="text-3xl font-bold text-[#FFC439] tracking-tight">GraftScope</span>
          </div>
        </div>
        
        <div className="space-y-8 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Partner Program<br />
              Dashboard
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Track your earnings, manage commissions, and grow your partnership with ClinixGlow & Graftscope.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">Real-time commission tracking</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="font-medium">Detailed analytics & reports</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-medium">Instant payout processing</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-white/60 relative z-10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Secure login protected by industry-standard encryption</span>
        </div>
      </div>
      
      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FAFAFA]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
