import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Shield,
  Clock,
  MapPin,
  Users,
  Search,
  Sparkles,
  Lock,
  Layers,
  HelpCircle,
  AlertOctagon,
  Radio,
  EyeOff,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Activity,
  Zap,
  Network,
  Share2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useZone } from '../context/ZoneContext';

export const LandingPage: React.FC = () => {
  const { currentZone, setCurrentZone, zones } = useZone();

  // Hero interactive preview mode
  const [activePreviewTab, setActivePreviewTab] = useState<'matrix' | 'radar' | 'protocol'>('matrix');
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);

  const demoPerimeters = [
    {
      name: 'Tech Campus Quad',
      type: 'campus',
      radius: '450m Geofence',
      activeNeeds: 4,
      helpers: 8,
      efficiency: '96.2%',
      primaryNeed: 'CS Lab 302: Blue Hydro Flask found at 3D printer desk',
      matchedOffer: 'Elena verified item safekeeping with lab assistant',
    },
    {
      name: 'Innovation Arena',
      type: 'hackathon',
      radius: '300m Geofence',
      activeNeeds: 6,
      helpers: 12,
      efficiency: '98.4%',
      primaryNeed: 'Team Alpha: Need 1 Frontend Engineer for Drone Vision UI',
      matchedOffer: 'Bilateral match established with Marcus (94% skill score)',
    },
    {
      name: 'Central Transit Terminal',
      type: 'transit',
      radius: '600m Geofence',
      activeNeeds: 3,
      helpers: 5,
      efficiency: '92.1%',
      primaryNeed: 'Platform 4: Escalator maintenance update needed for wheelchair access',
      matchedOffer: 'Station volunteer verified elevator route clear',
    },
  ];

  const handleSelectDemoZone = (index: number) => {
    setSelectedDemoIndex(index);
    const demo = demoPerimeters[index];
    const found = zones.find((z) => z.name.toLowerCase().includes(demo.name.toLowerCase().split(' ')[0])) || zones[0];
    if (found) {
      setCurrentZone(found);
    }
  };

  return (
    <div className="relative">
      {/* ========================================================= */}
      {/* 1. CINEMATIC HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative pt-16 pb-20 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-7 animate-fade-in">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-plum-900 leading-[1.08] brand-font">
            Where Local Needs <br className="hidden sm:inline" />
            <span className="brand-gradient-text">Meet Real Solutions.</span>
          </h1>

          {/* Supporting Description */}
          <p className="text-base sm:text-lg md:text-xl text-plum-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Discover meaningful local connections, find relevant help, and turn real-world challenges into
            collaborative solutions. DropZone enables privacy-first, location-aware interactions that bring
            people together when and where they matter.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-base shadow-rose-glow px-8 py-3.5"
                leftIcon={<Compass className="w-5 h-5 text-white" />}
              >
                Explore DropZone
              </Button>
            </Link>

            <Link to="/create-post" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-base px-7 py-3.5"
                rightIcon={<ChevronRight className="w-4 h-4 text-plum-400" />}
              >
                Share a Need or Offer
              </Button>
            </Link>
          </div>

          {/* Privacy Trust Signal */}
          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] sm:text-xs text-plum-500 tracking-wide font-medium">
            <Shield className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Location verified on-device. Zero GPS coordinate broadcast or persistent tracking.</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SPATIAL ZONE RADAR & NEED MATRIX INTERACTIVE DEMO */}
        {/* ========================================================= */}
        <div className="mt-14 md:mt-20 relative max-w-5xl mx-auto">
          {/* Soft Deep Spatial Aura */}
          <div className="absolute -inset-4 bg-gradient-to-r from-rose-300/20 via-plum-200/30 to-rose-400/20 rounded-[38px] blur-3xl opacity-60 -z-10" />

          <div className="relative rounded-3xl p-px bg-gradient-to-b from-plum-200 via-rose-300/30 to-plum-200 shadow-plum-lg">
            <div className="rounded-[23px] bg-white border border-plum-200 p-5 md:p-8 space-y-6 shadow-plum-sm">
              
              {/* Top Spatial Control Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-plum-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex items-center gap-2 pl-2">
                    <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-plum-900">
                      Spatial Perimeter Engine
                    </span>
                  </div>
                </div>

                {/* Spatial Zone Perimeters Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                  {demoPerimeters.map((p, idx) => (
                    <button
                      key={p.name}
                      onClick={() => handleSelectDemoZone(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        selectedDemoIndex === idx
                          ? 'bg-rose-500 text-white border border-rose-500 shadow-rose-glow-sm'
                          : 'bg-plum-100/70 text-plum-700 hover:text-plum-900 border border-plum-200'
                      }`}
                    >
                      <MapPin className={`w-3 h-3 ${selectedDemoIndex === idx ? 'text-white' : 'text-rose-500'}`} />
                      <span>{p.name}</span>
                      <span className={`text-[10px] font-mono ${selectedDemoIndex === idx ? 'text-rose-100' : 'text-plum-500'}`}>({p.radius})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode Tabs */}
              <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 bg-plum-100 p-1 rounded-xl border border-plum-200">
                  <button
                    onClick={() => setActivePreviewTab('matrix')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                      activePreviewTab === 'matrix'
                        ? 'bg-white text-plum-900 shadow-plum-sm font-bold'
                        : 'text-plum-600 hover:text-plum-900'
                    }`}
                  >
                    Need Resolution Matrix
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('radar')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                      activePreviewTab === 'radar'
                        ? 'bg-white text-plum-900 shadow-plum-sm font-bold'
                        : 'text-plum-600 hover:text-plum-900'
                    }`}
                  >
                    Abstract Spatial Radar
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('protocol')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                      activePreviewTab === 'protocol'
                        ? 'bg-white text-plum-900 shadow-plum-sm font-bold'
                        : 'text-plum-600 hover:text-plum-900'
                    }`}
                  >
                    Privacy Protocol State
                  </button>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-plum-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Bilateral Matching: Active
                  </span>
                  <span className="text-plum-300">•</span>
                  <span className="text-rose-600 font-bold">{demoPerimeters[selectedDemoIndex].efficiency} Resolution Rate</span>
                </div>
              </div>

              {/* Interactive Widget Main Display */}
              {activePreviewTab === 'matrix' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Active Need Card */}
                  <div className="p-5 rounded-2xl bg-plum-100/50 border border-plum-200 hover:border-rose-300 transition-all space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 font-bold uppercase text-[10px]">
                        Active Need Broadcast
                      </span>
                      <span className="text-plum-500 flex items-center gap-1.5 text-xs font-mono">
                        <Clock className="w-3.5 h-3.5 text-rose-500" /> Auto-Expiring in 3h 40m
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-plum-900 brand-font">
                      {demoPerimeters[selectedDemoIndex].primaryNeed}
                    </h4>

                    <p className="text-xs text-plum-700 leading-relaxed">
                      Broadcast confined strictly within the {demoPerimeters[selectedDemoIndex].radius} perimeter. No permanent database footprint upon completion.
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-plum-200 text-[11px] text-plum-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Zone Authenticated Peer
                      </span>
                      <span className="text-rose-600 font-mono font-semibold">Bilateral Protocol Ready</span>
                    </div>
                  </div>

                  {/* Right: Matched Action Card */}
                  <div className="p-5 rounded-2xl bg-plum-100/50 border border-plum-200 hover:border-rose-300 transition-all space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-semantic-success-bg text-semantic-success border border-semantic-success-border font-bold uppercase text-[10px]">
                        Matched Solution
                      </span>
                      <span className="text-semantic-success flex items-center gap-1.5 text-xs font-mono font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 94% Explainable Match
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-plum-900 brand-font">
                      {demoPerimeters[selectedDemoIndex].matchedOffer}
                    </h4>

                    <p className="text-xs text-plum-700 leading-relaxed">
                      Temporary private collaboration room initialized with automatic 4-hour countdown and zero coordinate disclosure.
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-plum-200 text-[11px] text-plum-600">
                      <span className="text-rose-600 font-mono font-medium">Collaboration: IN_PROGRESS</span>
                      <span className="text-plum-500 font-mono">End-to-End Ephemeral</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'radar' && (
                <div className="p-6 rounded-2xl bg-plum-100/50 border border-plum-200 flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Abstract Spatial Vector Art */}
                  <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 rounded-full border border-rose-300 animate-ping opacity-25" />
                    <div className="absolute w-44 h-44 rounded-full border border-dashed border-rose-400/40 animate-spin-slow" />
                    <div className="absolute w-32 h-32 rounded-full border border-plum-300" />
                    <div className="absolute w-20 h-20 rounded-full border border-rose-400 bg-rose-100/50" />
                    <div className="w-4 h-4 rounded-full bg-rose-500 shadow-rose-glow-sm" />
                    
                    {/* Simulated anonymous points */}
                    <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                    <div className="absolute bottom-10 right-14 w-2 h-2 rounded-full bg-plum-700" />
                    <div className="absolute top-16 right-10 w-2 h-2 rounded-full bg-emerald-600" />
                  </div>

                  <div className="space-y-3 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-rose-600 uppercase font-bold">
                        Topographic Proximity Model
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-plum-900 brand-font">
                      Concentric Geofence Verification
                    </h3>
                    <p className="text-xs text-plum-700 leading-relaxed">
                      DropZone constructs abstract mathematical concentric perimeters around physical spaces. Your device computes distance locally using the Haversine formula against zone boundary definitions, guaranteeing full participant privacy.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                      <div className="p-2 rounded-lg bg-white border border-plum-200 shadow-plum-sm">
                        <span className="text-plum-500 block">Radius</span>
                        <span className="text-rose-600 font-bold">{demoPerimeters[selectedDemoIndex].radius}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-plum-200 shadow-plum-sm">
                        <span className="text-plum-500 block">Active Mesh</span>
                        <span className="text-plum-900 font-bold">{demoPerimeters[selectedDemoIndex].activeNeeds} Needs • {demoPerimeters[selectedDemoIndex].helpers} Helpers</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-plum-200 shadow-plum-sm">
                        <span className="text-plum-500 block">GPS Leaks</span>
                        <span className="text-semantic-success font-bold">0.00% Zero</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'protocol' && (
                <div className="p-6 rounded-2xl bg-plum-100/50 border border-plum-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-rose-600 font-bold">
                      <Lock className="w-4 h-4" />
                      <span>Cryptographic Ephemeral Token Lifecycle</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-plum-700 border border-plum-200">
                      RFC-8705 Compliant
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-plum-200 space-y-1 shadow-plum-sm">
                      <span className="text-rose-600 font-mono text-[10px] font-bold">STEP 01</span>
                      <div className="font-bold text-plum-900">ContextPass</div>
                      <p className="text-[11px] text-plum-600">One-time zone token issued without persistent tracking.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-plum-200 space-y-1 shadow-plum-sm">
                      <span className="text-plum-700 font-mono text-[10px] font-bold">STEP 02</span>
                      <div className="font-bold text-plum-900">Need Post</div>
                      <p className="text-[11px] text-plum-600">Structured urgency with strictly enforced TTL expiration.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-plum-200 space-y-1 shadow-plum-sm">
                      <span className="text-rose-600 font-mono text-[10px] font-bold">STEP 03</span>
                      <div className="font-bold text-plum-900">Smart Match</div>
                      <p className="text-[11px] text-plum-600">Multi-factor engine correlates skills, category, and capacity.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-plum-200 space-y-1 shadow-plum-sm">
                      <span className="text-semantic-success font-mono text-[10px] font-bold">STEP 04</span>
                      <div className="font-bold text-plum-900">Secure Purge</div>
                      <p className="text-[11px] text-plum-600">Database purge upon task resolution or timer completion.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. THE HYPER-LOCAL DILEMMA */}
      {/* ========================================================= */}
      <section className="py-20 md:py-28 border-y border-plum-200 bg-plum-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold tracking-wider uppercase text-rose-600 font-mono">
              The Hyper-Local Dilemma
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-plum-900 brand-font">
              Why Traditional Feeds <span className="brand-gradient-text">Fail Physical Spaces</span>
            </h2>
            <p className="text-sm sm:text-base text-plum-600">
              Finding immediate, contextual assistance in physical venues on general social platforms has become virtually impossible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card bg-white p-8 rounded-3xl space-y-4 border border-plum-200 hover:border-rose-400 shadow-plum-sm">
              <div className="w-12 h-12 rounded-2xl bg-semantic-error-bg border border-rose-300 text-semantic-error flex items-center justify-center shadow-plum-sm">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-plum-900 brand-font">Algorithmic Noise</h3>
              <p className="text-sm text-plum-600 leading-relaxed">
                Global recommendation engines bury time-sensitive local notices underneath viral clickbait and sponsored advertising from miles away.
              </p>
            </div>

            <div className="glass-card bg-white p-8 rounded-3xl space-y-4 border border-plum-200 hover:border-rose-400 shadow-plum-sm">
              <div className="w-12 h-12 rounded-2xl bg-semantic-warning-bg border border-semantic-warning-border text-semantic-warning flex items-center justify-center shadow-plum-sm">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-plum-900 brand-font">Permanent Digital Baggage</h3>
              <p className="text-sm text-plum-600 leading-relaxed">
                A simple question like "Is the CS lab printer working?" shouldn't live permanently on an indexed public profile for years to come.
              </p>
            </div>

            <div className="glass-card bg-white p-8 rounded-3xl space-y-4 border border-plum-200 hover:border-rose-400 shadow-plum-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center shadow-plum-sm">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-plum-900 brand-font">Invasive Coordinates</h3>
              <p className="text-sm text-plum-600 leading-relaxed">
                Legacy apps harvest and store precise raw GPS trails, exposing daily commute routes and individual dwell times to third parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. HOW DROPZONE OPERATES (SPATIAL WORKFLOW) */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-24 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-xs font-bold tracking-wider uppercase text-rose-600 font-mono">
            Spatial Need-to-Action Protocol
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-plum-900 brand-font">
            How DropZone Works
          </h2>
          <p className="text-plum-600 text-sm sm:text-base">
            Engineered from first principles for instant real-world collaboration without permanent data hoarding.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card bg-white p-8 rounded-3xl space-y-3 relative overflow-hidden border border-plum-200 hover:border-rose-400 shadow-plum-sm">
            <span className="text-4xl font-extrabold text-rose-300 font-mono">01</span>
            <h3 className="text-lg font-bold text-plum-900 brand-font">Enter Eligible Zone</h3>
            <p className="text-xs text-plum-600 leading-relaxed">
              Verify eligibility for a campus quad, hackathon floor, or transit terminal through on-device proximity math.
            </p>
          </div>

          <div className="glass-card bg-white p-8 rounded-3xl space-y-3 relative overflow-hidden border border-plum-200 hover:border-rose-400 shadow-plum-sm">
            <span className="text-4xl font-extrabold text-rose-300 font-mono">02</span>
            <h3 className="text-lg font-bold text-plum-900 brand-font">Broadcast or Offer</h3>
            <p className="text-xs text-plum-600 leading-relaxed">
              Drop an urgent need or offer your assistance with audio speech transcription, AI intent extraction, and strict TTL expiry.
            </p>
          </div>

          <div className="glass-card bg-white p-8 rounded-3xl space-y-3 relative overflow-hidden border border-plum-200 hover:border-rose-400 shadow-plum-sm">
            <span className="text-4xl font-extrabold text-rose-300 font-mono">03</span>
            <h3 className="text-lg font-bold text-plum-900 brand-font">Explainable Match</h3>
            <p className="text-xs text-plum-600 leading-relaxed">
              Our explainable multi-factor scoring algorithm pairs needs with helpers based on skills, category, and capacity.
            </p>
          </div>

          <div className="glass-card bg-white p-8 rounded-3xl space-y-3 relative overflow-hidden border border-plum-200 hover:border-rose-400 shadow-plum-sm">
            <span className="text-4xl font-extrabold text-rose-300 font-mono">04</span>
            <h3 className="text-lg font-bold text-plum-900 brand-font">Resolve & Zero Trace</h3>
            <p className="text-xs text-plum-600 leading-relaxed">
              Coordinate in a temporary workspace. Once marked resolved, posts and private notes are safely purged.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. VISUAL INTELLIGENCE & EXPLAINABLE MATCHING */}
      {/* ========================================================= */}
      <section className="py-24 md:py-32 border-t border-plum-200 bg-plum-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold tracking-wider uppercase text-rose-600 font-mono">
              Transparent Algorithmic Engine
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-plum-900 brand-font">
              Real Visual Intelligence, <span className="brand-gradient-text">Not Black-Box Claims</span>
            </h2>
            <p className="text-plum-600 text-sm sm:text-base">
              Every match score produced by DropZone includes an auditable breakdown so participants understand exactly why a match was recommended.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card bg-white p-6 rounded-2xl border border-plum-200 space-y-2 shadow-plum-sm">
              <div className="text-2xl font-mono font-bold text-rose-600">40%</div>
              <div className="text-sm font-bold text-plum-900">Skill & Capability</div>
              <p className="text-xs text-plum-600">
                Direct overlap between required skills (e.g., Python, Figma, Hardware) and helper proficiencies.
              </p>
            </div>

            <div className="glass-card bg-white p-6 rounded-2xl border border-plum-200 space-y-2 shadow-plum-sm">
              <div className="text-2xl font-mono font-bold text-plum-700">30%</div>
              <div className="text-sm font-bold text-plum-900">Active Availability</div>
              <p className="text-xs text-plum-600">
                Helper presence status and active session duration within the physical perimeter.
              </p>
            </div>

            <div className="glass-card bg-white p-6 rounded-2xl border border-plum-200 space-y-2 shadow-plum-sm">
              <div className="text-2xl font-mono font-bold text-rose-500">20%</div>
              <div className="text-sm font-bold text-plum-900">Category Relevance</div>
              <p className="text-xs text-plum-600">
                Exact domain alignment across coding, event questions, lost items, and team formation.
              </p>
            </div>

            <div className="glass-card bg-white p-6 rounded-2xl border border-plum-200 space-y-2 shadow-plum-sm">
              <div className="text-2xl font-mono font-bold text-semantic-success">10%</div>
              <div className="text-sm font-bold text-plum-900">Workload Balance</div>
              <p className="text-xs text-plum-600">
                Prevents helper exhaustion by favoring peers without active ongoing collaborations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. SPATIAL ENVIRONMENTS WHERE DROPZONE EXCELS */}
      {/* ========================================================= */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-plum-900 brand-font">
            Where DropZone Excels
          </h2>
          <p className="text-plum-600 text-sm sm:text-base">
            Optimized for physical micro-communities where hyper-local presence matters infinitely more than follower counts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'College Campuses', desc: 'Dorm life, study halls, library lost & found notices' },
            { title: 'Hackathons', desc: 'Team formation, mentor requests, hardware sharing' },
            { title: 'Public Conferences', desc: 'Speaker Q&A, spontaneous breakout meetups' },
            { title: 'Transit Hubs', desc: 'Platform delay updates, accessibility assistance' },
            { title: 'Local Communities', desc: 'Neighborhood initiatives and co-working spaces' },
          ].map((item) => (
            <div key={item.title} className="glass-card bg-white p-6 rounded-3xl space-y-2 border border-plum-200 hover:border-rose-400 shadow-plum-sm">
              <h3 className="text-base font-bold text-plum-900 brand-font">{item.title}</h3>
              <p className="text-xs text-plum-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. PRIVACY GUARANTEE BLUEPRINT */}
      {/* ========================================================= */}
      <section className="py-20 md:py-28 border-t border-plum-200 bg-plum-100/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card bg-white p-8 md:p-12 rounded-3xl border border-plum-200 shadow-plum-md">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-2xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center shrink-0 shadow-rose-glow-sm">
                <Shield className="w-10 h-10" />
              </div>
              <div className="space-y-3 text-center md:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 font-mono">
                  Privacy-First Blueprint
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-plum-900 brand-font">
                  Proximity For Eligibility, Never Tracking
                </h3>
                <p className="text-sm text-plum-700 leading-relaxed">
                  DropZone uses approximate on-device distance to verify your eligibility for a zone's feed.
                  Your exact coordinates are never broadcast to other users, never stored in central databases,
                  and never monetized.
                </p>
                <div className="pt-2">
                  <Link to="/privacy">
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Read Our Full Privacy Policy
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. CALL TO ACTION SECTION */}
      {/* ========================================================= */}
      <section className="py-24 md:py-36 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto p-10 md:p-16 rounded-3xl bg-plum-900 text-white shadow-plum-lg border border-plum-800 space-y-6">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white brand-font">
            Ready to Experience <span className="text-rose-400">DropZone</span>?
          </h2>
          <p className="text-base text-plum-200 max-w-xl mx-auto leading-relaxed">
            Discover active campus quads, hackathon arenas, and community perimeters in your area.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/zones" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-rose-glow px-8 py-3.5">
                Explore Active Zones
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-3.5">
                View Feed Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
