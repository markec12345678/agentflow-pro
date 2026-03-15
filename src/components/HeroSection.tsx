/**
 * AgentFlow Pro - Hero Section Component
 * Based on 2025-2026 Design Trends
 * 
 * Features:
 * - Electric Indigo color scheme
 * - Bento grid layout
 * - Dark mode first
 * - Video background support
 * - Mobile responsive
 * - Conversion optimized
 */

'use client';

import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <section 
      className="hero-section"
      style={{
        background: 'linear-gradient(135deg, #03012D 0%, #0A0A2E 100%)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Elements */}
      <div 
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(111,0,255,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      
      <div 
        className="container"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '60px 20px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header with Logo & CTA */}
        <header 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '60px',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div 
              style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #6F00FF 0%, #22D3EE 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: 'white',
                fontSize: '20px',
              }}
            >
              AF
            </div>
            <div>
              <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
                AgentFlow Pro
              </h1>
              <p style={{ color: '#94A3B8', margin: '5px 0 0 0', fontSize: '14px' }}>
                Multi-Agent AI Platform
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/register'}
            style={{
              background: 'linear-gradient(135deg, #6F00FF 0%, #8B3DFF 100%)',
              color: 'white',
              border: 'none',
              padding: '15px 40px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(111,0,255,0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(111,0,255,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(111,0,255,0.4)';
            }}
          >
            Start Free Trial
          </button>
        </header>
        
        {/* Main Hero Content */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: '800',
              color: 'white',
              marginBottom: '20px',
              lineHeight: '1.1',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Automate Your Business<br />with AI Agents
          </h2>
          <p 
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: '#94A3B8',
              maxWidth: '700px',
              margin: '0 auto 40px auto',
              lineHeight: '1.6',
              padding: '0 10px',
            }}
          >
            Multi-agent AI platform for business automation with Research, Content, 
            Code, and Deploy agents. Build workflows, manage knowledge, and scale 
            your operations.
          </p>
          
          <div 
            style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              padding: '0 10px',
            }}
          >
            <button 
              onClick={() => window.location.href = '/register'}
              style={{
                background: 'linear-gradient(135deg, #6F00FF 0%, #8B3DFF 100%)',
                color: 'white',
                border: 'none',
                padding: 'clamp(14px, 2vw, 18px) clamp(30px, 4vw, 50px)',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: 'clamp(16px, 2vw, 18px)',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(111,0,255,0.4)',
                transition: 'all 0.3s ease',
              }}
            >
              Start Building Free
            </button>
            <button 
              onClick={() => {
                const video = document.getElementById('promo-video');
                if (video) {
                  video.requestFullscreen?.();
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: 'clamp(14px, 2vw, 18px) clamp(30px, 4vw, 50px)',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: 'clamp(16px, 2vw, 18px)',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
            >
              🎬 Watch Demo
            </button>
          </div>
        </div>
        
        {/* Promo Video Section */}
        <div 
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(111,0,255,0.2)',
            borderRadius: '20px',
            padding: '10px',
            marginBottom: '60px',
            boxShadow: '0 20px 60px rgba(111,0,255,0.2)',
          }}
        >
          <video 
            id="promo-video"
            autoPlay 
            muted 
            loop 
            playsInline 
            onLoadedData={() => setIsVideoLoaded(true)}
            style={{
              width: '100%',
              borderRadius: '12px',
              display: 'block',
              opacity: isVideoLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          >
            <source src="/promo/agentflow-pro-promo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {!isVideoLoaded && (
            <div 
              style={{
                width: '100%',
                aspectRatio: '16/9',
                background: 'linear-gradient(135deg, #0A0A2E 0%, #03012D 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
              }}
            >
              Loading video...
            </div>
          )}
        </div>
        
        {/* Social Proof */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <p 
            style={{
              color: '#94A3B8',
              fontSize: '14px',
              marginBottom: '25px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Trusted by 500+ innovative teams
          </p>
          <div 
            style={{
              display: 'flex',
              gap: '30px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              opacity: 0.6,
              padding: '0 10px',
            }}
          >
            {/* Company logo placeholders - replace with real logos */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                style={{
                  height: '40px',
                  width: '120px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Bento Grid Feature Showcase */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '60px',
            padding: '0 10px',
          }}
        >
          <FeatureCard
            emoji="📊"
            gradient="linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)"
            title="Real-Time Analytics"
            description="Track occupancy rates, revenue metrics, and performance KPIs with beautiful visualizations."
          />
          <FeatureCard
            emoji="📅"
            gradient="linear-gradient(135deg, #6F00FF 0%, #8B3DFF 100%)"
            title="Smart Calendar"
            description="Manage bookings, automate scheduling, and sync across all your channels seamlessly."
          />
          <FeatureCard
            emoji="✅"
            gradient="linear-gradient(135deg, #39FF14 0%, #22C55E 100%)"
            title="Task Automation"
            description="AI-powered task management with priority detection and automated assignments."
          />
          <FeatureCard
            emoji="💰"
            gradient="linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)"
            title="Revenue Tracking"
            description="Monitor income streams, forecast revenue, and optimize pricing with AI insights."
          />
        </div>
        
        {/* Feature Bullets */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            marginBottom: '60px',
            padding: '0 10px',
          }}
        >
          <FeatureBullet text="Multi-Agent AI System" />
          <FeatureBullet text="Workflow Builder" />
          <FeatureBullet text="Memory Knowledge Graph" />
          <FeatureBullet text="Stripe Integration" />
          <FeatureBullet text="Playwright E2E Tests" />
          <FeatureBullet text="Vercel Deploy Ready" />
        </div>
      </div>
    </section>
  );
}

// Feature Card Component
function FeatureCard({ emoji, gradient, title, description }: {
  emoji: string;
  gradient: string;
  title: string;
  description: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      style={{
        background: 'rgba(13,13,58,0.8)',
        border: '1px solid rgba(111,0,255,0.3)',
        borderRadius: '16px',
        padding: '30px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        borderColor: isHovered ? 'rgba(111,0,255,0.6)' : 'rgba(111,0,255,0.3)',
        boxShadow: isHovered ? '0 10px 40px rgba(111,0,255,0.3)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        style={{
          width: '50px',
          height: '50px',
          background: gradient,
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}
      >
        {emoji}
      </div>
      <h3 style={{ color: 'white', fontSize: '22px', marginBottom: '10px' }}>
        {title}
      </h3>
      <p style={{ color: '#94A3B8', lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}

// Feature Bullet Component
function FeatureBullet({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94A3B8' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" fill="#39FF14" />
        <path 
          d="M6 10L9 13L14 7" 
          stroke="#03012D" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      <span>{text}</span>
    </div>
  );
}
