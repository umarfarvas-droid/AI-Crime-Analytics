import React from 'react';

export default function ForensicBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Base Deep Background */}
      <div className="absolute inset-0 bg-[#05070d]" />

      {/* 3D Perspective Cyber Grid Plane */}
      <div className="cyber-grid-container">
        <div className="cyber-grid-plane" />
      </div>

      {/* Floating Ambient Light Spheres */}
      <div className="ambient-glow-cyan top-[-100px] left-[15%]" />
      <div className="ambient-glow-blue bottom-[-150px] right-[10%]" />

      {/* Subtle Horizontal Scanline Beam */}
      <div className="laser-scanner-line opacity-40" />

      {/* Subtle Background Data Coordinate Streams */}
      <div className="absolute top-24 left-6 text-[9px] font-mono text-cyan-500/20 select-none hidden 2xl:block space-y-1">
        <div>SYS_LAT: 13.0827 // SYS_LNG: 80.2707</div>
        <div>VECTOR_CLUSTER: ACTIVE [NODE-09]</div>
        <div>CRYPTO_CIPHER: SHA-256 SECURED</div>
      </div>

      <div className="absolute bottom-16 right-6 text-[9px] font-mono text-cyan-500/20 select-none hidden 2xl:block text-right space-y-1">
        <div>EVD_VAULT: SYNCED 100%</div>
        <div>NLP_ENGINE: SPRING_BOOT_3.2</div>
        <div>RECON_PIPELINE: STANDBY_READY</div>
      </div>
    </div>
  );
}
