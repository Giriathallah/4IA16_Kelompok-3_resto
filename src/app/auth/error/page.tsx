"use client";
import { useState, useEffect } from "react";
import {
  XCircle,
  RotateCcw,
  Home,
  Mail,
  AlertTriangle,
  Clock,
  Shield,
  HelpCircle,
} from "lucide-react";


const VerificationError = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setCountdown(60); // 1 minute cooldown

    // Simulate API call
    setTimeout(() => {
      setIsRetrying(false);
      console.log("Verification email resent");
      // You can add success notification here
    }, 2000);
  };

  const handleHome = () => {
    console.log("Navigating to home...");
    // window.location.href = '/';
  };

  const handleSupport = () => {
    console.log("Opening support...");
    // window.location.href = '/support';
  };

  const errorReasons = [
    {
      icon: Clock,
      title: "Link Kedaluwarsa",
      description: "Link verifikasi hanya berlaku 24 jam",
    },
    {
      icon: Shield,
      title: "Email Sudah Terverifikasi",
      description: "Mungkin akun Anda sudah aktif sebelumnya",
    },
    {
      icon: AlertTriangle,
      title: "Kesalahan Server",
      description: "Terjadi gangguan teknis sementara",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-page-gradient-start via-page-gradient-middle to-page-gradient-end flex items-center justify-center p-4">
      {/* Floating warning particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-feature-4-start rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div
        className={`max-w-lg w-full transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Error Card */}
        <div className="bg-surface-raised rounded-2xl p-8 shadow-2xl border border-border backdrop-blur-sm">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-feature-4-start to-feature-4-end rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-white" />
              </div>
              {/* Pulsing warning rings */}
              <div className="absolute -inset-3 border-2 border-feature-4-start/30 rounded-full animate-ping"></div>
              <div className="absolute -inset-1 border border-feature-4-end/50 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Error Content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-strong mb-4">
              Verifikasi Gagal
            </h1>
            <p className="text-text-subtle leading-relaxed text-lg mb-4">
              Maaf, terjadi kesalahan saat memverifikasi email Anda. Jangan
              khawatir, ini bisa diatasi dengan mudah.
            </p>

            {/* Status indicator */}
            <div className="inline-flex items-center px-4 py-2 bg-surface-sunken rounded-full border border-border">
              <div className="w-2 h-2 bg-feature-4-start rounded-full mr-2 animate-pulse"></div>
              <span className="text-text-subtle text-sm font-medium">
                Status: Verifikasi Diperlukan
              </span>
            </div>
          </div>

          {/* Error Reasons */}
          <div className="mb-8">
            <h3 className="text-text-strong font-semibold mb-4 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-brand" />
              Kemungkinan Penyebab:
            </h3>
            <div className="space-y-3">
              {errorReasons.map((reason, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-surface-sunken rounded-xl border border-border/50 hover:border-brand/30 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                    <reason.icon className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="font-medium text-text-strong text-sm">
                      {reason.title}
                    </p>
                    <p className="text-text-subtle text-xs mt-1">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Steps */}
          <div className="mb-8">
            <h3 className="text-text-strong font-semibold mb-4">
              Langkah Selanjutnya:
            </h3>
            <div className="bg-gradient-to-r from-brand-subtle/50 to-brand-subtle/30 rounded-xl p-4 border border-brand/20">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-brand rounded-full text-white flex items-center justify-center text-xs font-bold mr-3">
                    1
                  </div>
                  <span className="text-text-strong">
                    Klik tombol "Kirim Ulang Verifikasi"
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-brand rounded-full text-white flex items-center justify-center text-xs font-bold mr-3">
                    2
                  </div>
                  <span className="text-text-strong">
                    Periksa email Anda (termasuk folder spam)
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-brand rounded-full text-white flex items-center justify-center text-xs font-bold mr-3">
                    3
                  </div>
                  <span className="text-text-strong">
                    Klik link verifikasi yang baru
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying || countdown > 0}
              className="w-full bg-gradient-to-r from-cta-gradient-start via-cta-gradient-middle to-cta-gradient-end text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden"
            >
              {isRetrying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  <span>Mengirim...</span>
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="w-5 h-5 mr-2" />
                  <span>Tunggu {countdown}s</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <RotateCcw className="w-5 h-5 mr-2 transition-transform group-hover:rotate-180 relative" />
                  <span className="relative">Kirim Ulang Verifikasi</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleHome}
                className="bg-surface-sunken hover:bg-muted text-text-strong py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center border border-border"
              >
                <Home className="w-4 h-4 mr-2" />
                Beranda
              </button>

              <button
                onClick={handleSupport}
                className="bg-surface-sunken hover:bg-muted text-text-strong py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center border border-border"
              >
                <Mail className="w-4 h-4 mr-2" />
                Support
              </button>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-surface-raised/50 backdrop-blur-sm rounded-xl p-4 mt-4 border border-border/50">
          <div className="text-center">
            <p className="text-text-subtle text-sm mb-2">
              Masih mengalami masalah?
            </p>
            <button
              onClick={handleSupport}
              className="text-brand font-medium text-sm hover:underline inline-flex items-center"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Hubungi Tim Support Kami
            </button>
          </div>
        </div>

        {/* Additional help */}
        <div className="text-center mt-4">
          <p className="text-text-subtle text-xs">
            💡 Email verifikasi biasanya berlaku hanya 24 jam
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
};

export default VerificationError;
