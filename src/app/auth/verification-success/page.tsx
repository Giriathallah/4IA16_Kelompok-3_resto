"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Home, Mail, Sparkles } from "lucide-react";

const VerificationSuccess = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Trigger confetti effect
    setTimeout(() => setShowConfetti(true), 500);
  }, []);

  const handleHome = () => {
    // Navigate to home
    window.location.href = "/";
    console.log("Navigating to home...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-page-gradient-start via-page-gradient-middle to-page-gradient-end flex items-center justify-center p-4">
      {/* Floating particles animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-brand rounded-full opacity-20 animate-bounce`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div
        className={`max-w-md w-full transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Success Card */}
        <div className="bg-surface-raised rounded-2xl p-8 shadow-2xl border border-border backdrop-blur-sm">
          {/* Success Icon with Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className={`w-24 h-24 bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end rounded-full flex items-center justify-center transform transition-all duration-1000 ${
                  showConfetti ? "scale-110" : "scale-100"
                }`}
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              {/* Ripple effect */}
              <div className="absolute -inset-3 bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end rounded-full opacity-20 animate-ping"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end rounded-full opacity-30 animate-pulse"></div>

              {/* Sparkles */}
              {showConfetti && (
                <>
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin" />
                  <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-blue-400 animate-bounce" />
                  <Sparkles className="absolute top-0 -left-4 w-5 h-5 text-pink-400 animate-pulse" />
                </>
              )}
            </div>
          </div>

          {/* Success Content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-strong mb-4 bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end bg-clip-text text-transparent">
              Email Terverifikasi! 🎉
            </h1>
            <p className="text-text-subtle leading-relaxed text-lg">
              Selamat! Email Anda telah berhasil diverifikasi. Sekarang Anda
              dapat mengakses semua fitur aplikasi dengan akun yang sudah aktif.
            </p>
          </div>

          {/* Success Stats Card */}
          <div className="bg-gradient-to-r from-brand-subtle to-brand-subtle/50 rounded-xl p-5 mb-6 border border-brand/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center mr-3">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-text-strong font-semibold">Akun Aktif</p>
                  <p className="text-text-subtle text-sm">Siap digunakan</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-stat-positive rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="mb-8">
            <h3 className="text-text-strong font-semibold mb-3 text-center">
              Yang bisa Anda lakukan sekarang:
            </h3>
            <div className="space-y-2">
              {[
                "Akses dashboard lengkap",
                "Kelola profil dan pengaturan",
                "Terima notifikasi penting",
                "Nikmati semua fitur premium",
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center text-text-subtle text-sm"
                >
                  <div className="w-2 h-2 bg-stat-positive rounded-full mr-3"></div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleHome}
              className="w-full bg-surface-sunken hover:bg-muted text-text-strong py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center border border-border"
            >
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </button>
          </div>
        </div>

        {/* Thank you message */}
        <div className="text-center mt-6">
          <p className="text-text-subtle text-sm">
            Terima kasih telah bergabung dengan kami!
            <span className="inline-block ml-1 animate-bounce">🚀</span>
          </p>
        </div>

        {/* Additional features hint */}
        <div className="bg-surface-raised/50 backdrop-blur-sm rounded-xl p-4 mt-4 border border-border/50">
          <p className="text-center text-text-subtle text-xs">
            💡 <span className="font-medium">Pro tip:</span> Lengkapi profil
            Anda untuk pengalaman yang lebih personal
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccess;
