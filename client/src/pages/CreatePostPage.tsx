import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  Clock,
  Layers,
  Shield,
  Plus,
  HelpCircle,
  AlertCircle,
  Volume2,
  Globe,
  Radio,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useZone } from '../context/ZoneContext';
import { needService, offerService, zoneService } from '../services/api';
import { MatchDiscoveryModal } from '../components/modals/MatchDiscoveryModal';
import type { Zone, Need, NeedCategory } from '../types';

export const NEED_CATEGORIES_LIST: NeedCategory[] = [
  'Technical Help',
  'Team Formation',
  'UI/UX Design',
  'Coding & Debugging',
  'Hardware & IoT',
  'Event Questions',
  'Lost & Found',
];

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentZone, zones: contextZones, setCurrentZone } = useZone();

  // Mode: Need vs Offer
  const [activeTab, setActiveTab] = useState<'need' | 'offer'>('need');

  // Active Zone state
  const [zones, setZones] = useState<Zone[]>(contextZones || []);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    currentZone?._id || (currentZone as any)?.id || ''
  );

  // Need Form State
  const [needTitle, setNeedTitle] = useState('');
  const [needDescription, setNeedDescription] = useState('');
  const [needCategory, setNeedCategory] = useState<NeedCategory>('Coding & Debugging');
  const [needSkills, setNeedSkills] = useState<string[]>(['Python', 'FastAPI']);
  const [skillInput, setSkillInput] = useState('');
  const [needDuration, setNeedDuration] = useState<number>(60);
  const [needUrgency, setNeedUrgency] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [needExpiryHours, setNeedExpiryHours] = useState<number>(6);

  // Offer Form State
  const [offerSkills, setOfferSkills] = useState<string[]>(user?.skills || ['React', 'TypeScript']);
  const [offerSkillInput, setOfferSkillInput] = useState('');
  const [offerAvailability, setOfferAvailability] = useState<number>(120);
  const [offerCategories, setOfferCategories] = useState<string[]>(['Coding & Debugging', 'Technical Help']);
  const [offerExpiryHours, setOfferExpiryHours] = useState<number>(8);

  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'en-IN' | 'en-US' | 'hi-IN'>('en-IN');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isExtractingDraft, setIsExtractingDraft] = useState(false);
  const recognitionRef = useRef<any>(null);
  const preSpeechTextRef = useRef<string>('');
  const activeSpeechTargetRef = useRef<'need' | 'offer'>('need');

  // Submission & Validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [createdNeed, setCreatedNeed] = useState<Need | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

  // Load Zones on mount or sync with context
  useEffect(() => {
    if (contextZones && contextZones.length > 0) {
      setZones(contextZones);
      if (!selectedZoneId) {
        const active = currentZone || contextZones.find((z) => z.type === 'hackathon') || contextZones[0];
        setSelectedZoneId(active._id || (active as any).id);
      }
    } else {
      zoneService
        .getAllZones()
        .then((data) => {
          if (data && data.length > 0) {
            setZones(data);
            if (!selectedZoneId) {
              const active = currentZone || data.find((z) => z.type === 'hackathon') || data[0];
              setSelectedZoneId(active._id || (active as any).id);
            }
          }
        })
        .catch(() => {});
    }
  }, [contextZones, currentZone]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const fullCaptured = (finalTranscript + interimTranscript).trim();
        setSpeechTranscript(fullCaptured);

        // Stream into the appropriate editable field in real-time
        if (activeSpeechTargetRef.current === 'need') {
          const combined = (preSpeechTextRef.current + fullCaptured).trim();
          setNeedDescription(combined);
          setFieldErrors((prev) => ({ ...prev, description: '' }));
        } else {
          const combined = (preSpeechTextRef.current + fullCaptured).trim();
          setOfferSkillInput(combined);
          setFieldErrors((prev) => ({ ...prev, skills: '' }));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(
            'Microphone permission was denied. Please allow microphone access in your browser settings to use voice input, or type manually.'
          );
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech was detected. Please try speaking into your microphone or type manually.');
        } else if (event.error === 'network') {
          setSpeechError('Speech recognition service network error. You can continue by typing manually.');
        } else if (event.error !== 'aborted') {
          setSpeechError(`Speech recognition error: ${event.error}. You can continue by typing manually.`);
        }
      };

      recognition.onend = () => {
        // Do not auto-submit form on speech end!
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [speechLanguage]);

  const startListening = (target: 'need' | 'offer' = 'need') => {
    setSpeechError(null);
    if (!speechSupported || !recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser. Please type directly into the form fields.');
      return;
    }

    activeSpeechTargetRef.current = target;
    if (target === 'need') {
      preSpeechTextRef.current = needDescription ? needDescription.trim() + ' ' : '';
    } else {
      preSpeechTextRef.current = offerSkillInput ? offerSkillInput.trim() + ' ' : '';
    }

    setSpeechTranscript('');
    try {
      recognitionRef.current.lang = speechLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const toggleListening = (target: 'need' | 'offer' = 'need') => {
    if (isListening) {
      stopListening();
    } else {
      startListening(target);
    }
  };

  const handleExtractFromTranscript = async () => {
    const textToProcess = speechTranscript.trim() || needDescription.trim();
    if (!textToProcess) {
      setFormError('Please speak or type a description before extracting draft');
      return;
    }

    setIsExtractingDraft(true);
    setFormError(null);

    try {
      const extracted = await needService.extractDraft(textToProcess);
      setNeedTitle(extracted.suggestedTitle);
      setNeedDescription(extracted.cleanDescription);
      if (NEED_CATEGORIES_LIST.includes(extracted.category as any)) {
        setNeedCategory(extracted.category as any);
      }
      if (extracted.requiredSkills.length > 0) {
        setNeedSkills(extracted.requiredSkills);
      }
      setNeedDuration(extracted.estimatedDurationMinutes);
      setNeedUrgency(extracted.urgency);
      setNeedExpiryHours(extracted.expiryHours);
    } catch (err: any) {
      setFormError(err.message || 'Draft extraction failed');
    } finally {
      setIsExtractingDraft(false);
    }
  };

  const addSkill = (skill: string) => {
    const cleaned = skill.trim();
    if (cleaned && !needSkills.includes(cleaned)) {
      setNeedSkills((prev) => [...prev, cleaned]);
    }
    setSkillInput('');
    setFieldErrors((prev) => ({ ...prev, skills: '' }));
  };

  const removeSkill = (skill: string) => {
    setNeedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const addOfferSkill = (skill: string) => {
    const cleaned = skill.trim();
    if (cleaned && !offerSkills.includes(cleaned)) {
      setOfferSkills((prev) => [...prev, cleaned]);
    }
    setOfferSkillInput('');
    setFieldErrors((prev) => ({ ...prev, skills: '' }));
  };

  const removeOfferSkill = (skill: string) => {
    setOfferSkills((prev) => prev.filter((s) => s !== skill));
  };

  // Clear Form Handlers (Immediate React state reset, stops speech, preserves DB records)
  const handleClearNeedForm = () => {
    stopListening();
    setSpeechTranscript('');
    setSpeechError(null);
    setNeedTitle('');
    setNeedDescription('');
    setNeedSkills([]);
    setSkillInput('');
    setNeedCategory('Coding & Debugging');
    setNeedDuration(60);
    setNeedUrgency('normal');
    setNeedExpiryHours(6);
    setFormError(null);
    setFieldErrors({});
  };

  const handleClearOfferForm = () => {
    stopListening();
    setSpeechTranscript('');
    setSpeechError(null);
    setOfferSkills([]);
    setOfferSkillInput('');
    setOfferAvailability(120);
    setOfferCategories(['Coding & Debugging', 'Technical Help']);
    setOfferExpiryHours(8);
    setFormError(null);
    setFieldErrors({});
    setOfferSuccess(false);
  };

  const validateNeedForm = () => {
    const errors: { [key: string]: string } = {};
    if (!selectedZoneId) {
      errors.zone = 'Please select an active event zone';
    }
    if (!needTitle.trim()) {
      errors.title = 'Need title is required';
    } else if (needTitle.trim().length < 3) {
      errors.title = 'Need title must be at least 3 characters long';
    }
    if (!needDescription.trim()) {
      errors.description = 'Problem description is required';
    } else if (needDescription.trim().length < 5) {
      errors.description = 'Description must be at least 5 characters long';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateNeedForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await needService.createNeed({
        zoneId: selectedZoneId,
        title: needTitle.trim(),
        description: needDescription.trim(),
        category: needCategory,
        requiredSkills: needSkills,
        estimatedDurationMinutes: needDuration,
        urgency: needUrgency,
        expiryHours: needExpiryHours,
        visibility: 'members_only',
      });

      setCreatedNeed(created);
      setIsMatchModalOpen(true);
    } catch (err: any) {
      // Preserve user input on error and show clear error message
      setFormError(err.message || 'Failed to submit need');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateOfferForm = () => {
    const errors: { [key: string]: string } = {};
    if (!selectedZoneId) {
      errors.zone = 'Please select an active event zone';
    }
    let currentSkills = [...offerSkills];
    if (offerSkillInput.trim() && !currentSkills.includes(offerSkillInput.trim())) {
      currentSkills.push(offerSkillInput.trim());
      setOfferSkills(currentSkills);
      setOfferSkillInput('');
    }
    if (currentSkills.length === 0) {
      errors.skills = 'Please provide at least one skill you can offer to peers';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateOfferForm()) {
      return;
    }

    const skillsToSubmit = [...offerSkills];
    if (offerSkillInput.trim() && !skillsToSubmit.includes(offerSkillInput.trim())) {
      skillsToSubmit.push(offerSkillInput.trim());
    }

    setIsSubmitting(true);
    try {
      await offerService.createOrUpdateOffer({
        zoneId: selectedZoneId,
        skills: skillsToSubmit,
        availabilityMinutes: offerAvailability,
        preferredCategories: offerCategories,
        expiryHours: offerExpiryHours,
      });

      setOfferSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      // Preserve user input on error and show clear message
      setFormError(err.message || 'Failed to submit offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-28">
      <PageHeader
        title="Need-to-Action Studio"
        subtitle="Turn immediate local problems into verified collaborative action. Zero social feed noise."
        badge="Zero Baggage"
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-3 border-b border-plum-200 pb-4">
        <button
          type="button"
          onClick={() => {
            stopListening();
            setActiveTab('need');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'need'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-plum-700 hover:text-plum-900 bg-white border border-plum-200 shadow-sm'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeTab === 'need' ? 'bg-white' : 'bg-rose-500'}`} />
          <span>I Need Help (Create Need)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stopListening();
            setActiveTab('offer');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'offer'
              ? 'bg-plum-900 text-white shadow-sm'
              : 'text-plum-700 hover:text-plum-900 bg-white border border-plum-200 shadow-sm'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeTab === 'offer' ? 'bg-white' : 'bg-plum-900'}`} />
          <span>I Can Help (Publish Offer)</span>
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="font-semibold">{formError}</p>
        </div>
      )}

      {offerSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="font-semibold">
            Helper Offer Published! Your skills and availability are now active in the matching engine.
          </p>
        </div>
      )}

      {/* TAB 1: CREATE NEED */}
      {activeTab === 'need' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Column */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-6">
            {/* 1. VOICE INPUT HERO ACCORDION */}
            <div className="rounded-2xl border border-plum-200 bg-plum-50/70 p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-2xl transition-all ${
                      isListening && activeSpeechTargetRef.current === 'need'
                        ? 'bg-rose-100 text-rose-600 border border-rose-300 animate-pulse'
                        : 'bg-white text-rose-500 border border-plum-200'
                    }`}
                  >
                    {isListening && activeSpeechTargetRef.current === 'need' ? (
                      <Mic className="w-5 h-5" />
                    ) : (
                      <MicOff className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-plum-900 flex items-center gap-2">
                      <span>Voice-First Request Creation</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-plum-100 text-plum-800 border border-plum-200">
                        Web Speech API
                      </span>
                    </h3>
                    <p className="text-[11px] text-plum-600">
                      Speak your need naturally — text streams directly into the description below.
                    </p>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-plum-500" />
                  <select
                    value={speechLanguage}
                    onChange={(e: any) => setSpeechLanguage(e.target.value)}
                    className="bg-white border border-plum-200 text-plum-800 text-xs rounded-xl py-1 px-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                  >
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (US)</option>
                    <option value="hi-IN">Hindi (India)</option>
                  </select>
                </div>
              </div>

              {/* Speech Error / Unsupported Notice */}
              {speechError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{speechError}</span>
                </div>
              )}
              {!speechSupported && (
                <div className="p-3 rounded-xl bg-plum-100 border border-plum-200 text-plum-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-plum-600 shrink-0" />
                  <span>Speech recognition is not supported in this browser. Please type directly into the form fields.</span>
                </div>
              )}

              {/* Mic Action Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant={isListening && activeSpeechTargetRef.current === 'need' ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => toggleListening('need')}
                  leftIcon={
                    isListening && activeSpeechTargetRef.current === 'need' ? (
                      <MicOff className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )
                  }
                  className={
                    isListening && activeSpeechTargetRef.current === 'need'
                      ? 'border-rose-300 text-rose-700 bg-rose-50'
                      : ''
                  }
                >
                  {isListening && activeSpeechTargetRef.current === 'need'
                    ? 'Stop Listening'
                    : 'Start Speaking'}
                </Button>

                {speechTranscript && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    isLoading={isExtractingDraft}
                    onClick={handleExtractFromTranscript}
                    leftIcon={<Sparkles className="w-4 h-4 text-rose-500" />}
                  >
                    AI Extract Structured Draft
                  </Button>
                )}

                {isListening && activeSpeechTargetRef.current === 'need' && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs animate-pulse font-mono ml-auto">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Listening... speak now (streaming into description)</span>
                  </div>
                )}
              </div>

              {/* Live Transcript Display Box */}
              {speechTranscript && (
                <div className="p-3.5 rounded-xl bg-white border border-plum-200 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[10px] font-mono text-plum-500">
                    <span>Captured Audio Transcript:</span>
                    <button
                      type="button"
                      onClick={() => setSpeechTranscript('')}
                      className="text-plum-600 hover:text-plum-900 font-semibold"
                    >
                      Clear Transcript
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={speechTranscript}
                    onChange={(e) => setSpeechTranscript(e.target.value)}
                    className="w-full bg-transparent text-plum-900 text-xs focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>

            {/* 2. STRUCTURED NEED FORM */}
            <form onSubmit={handleNeedSubmit} className="space-y-6" noValidate>
              {/* Event Zone Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-plum-700">
                  Target Event Zone / Perimeter <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedZoneId(newId);
                    setFieldErrors((prev) => ({ ...prev, zone: '' }));
                    const matched = zones.find((z) => (z._id || (z as any).id) === newId);
                    if (matched) setCurrentZone(matched);
                  }}
                  className={`w-full bg-white border ${
                    fieldErrors.zone ? 'border-rose-500 ring-1 ring-rose-300' : 'border-plum-200'
                  } text-plum-900 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition`}
                >
                  {zones.map((z) => {
                    const zid = z._id || (z as any).id;
                    return (
                      <option key={zid} value={zid}>
                        {z.name} ({z.type.toUpperCase()} • {z.radiusMeters || z.radius || 450}m perimeter)
                      </option>
                    );
                  })}
                </select>
                {fieldErrors.zone && (
                  <p className="text-rose-600 text-xs mt-1 animate-fadeIn">{fieldErrors.zone}</p>
                )}
              </div>

              {/* Need Category */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-plum-700">
                  Request Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {NEED_CATEGORIES_LIST.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setNeedCategory(cat)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                        needCategory === cat
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-white text-plum-700 border-plum-200 hover:bg-plum-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-plum-500">
                  <span className="font-semibold text-plum-700">
                    Need Title <span className="text-rose-500">*</span>
                  </span>
                  <span className="font-mono text-[11px]">{needTitle.length}/120</span>
                </div>
                <Input
                  placeholder="e.g. Need Python & FastAPI developer for 1 hour to fix MongoDB indexing"
                  value={needTitle}
                  onChange={(e) => {
                    setNeedTitle(e.target.value);
                    if (e.target.value.trim().length >= 3) {
                      setFieldErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  error={fieldErrors.title}
                  required
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-plum-500">
                  <span className="font-semibold text-plum-700">
                    Problem Description & Context <span className="text-rose-500">*</span>
                  </span>
                  <span className="font-mono text-[11px]">{needDescription.length}/2000</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Detail your exact hurdle, current tech stack, and what assistance is needed... (You can type or speak)"
                  value={needDescription}
                  onChange={(e) => {
                    setNeedDescription(e.target.value);
                    if (e.target.value.trim().length >= 5) {
                      setFieldErrors((prev) => ({ ...prev, description: '' }));
                    }
                  }}
                  className={`w-full bg-white border ${
                    fieldErrors.description ? 'border-rose-500 ring-1 ring-rose-300' : 'border-plum-200'
                  } text-plum-900 placeholder-plum-400 text-xs rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition`}
                />
                {fieldErrors.description && (
                  <p className="text-rose-600 text-xs mt-1 animate-fadeIn">{fieldErrors.description}</p>
                )}
              </div>

              {/* Required Skills Input Strip */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-plum-700">
                  Required Skills & Tags
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type skill tag (e.g. Docker, PyTorch, React) and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                    className="flex-1 bg-white border border-plum-200 text-plum-900 placeholder-plum-400 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => addSkill(skillInput)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {needSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-plum-100 border border-plum-200 text-plum-900 text-xs font-mono font-semibold"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="text-plum-500 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {needSkills.length === 0 && (
                    <span className="text-[11px] text-plum-500 italic">
                      No skill tags added (matching engine will score based on general availability)
                    </span>
                  )}
                </div>
                {fieldErrors.skills && (
                  <p className="text-rose-600 text-xs mt-1 animate-fadeIn">{fieldErrors.skills}</p>
                )}
              </div>

              {/* Task Duration & Urgency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-plum-700">
                    Estimated Duration
                  </label>
                  <select
                    value={needDuration}
                    onChange={(e) => setNeedDuration(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-plum-200 text-plum-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={90}>1.5 Hours</option>
                    <option value={120}>2 Hours</option>
                    <option value={180}>3 Hours</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-plum-700">
                    Urgency Level
                  </label>
                  <select
                    value={needUrgency}
                    onChange={(e: any) => setNeedUrgency(e.target.value)}
                    className="w-full bg-white border border-plum-200 text-plum-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition"
                  >
                    <option value="low">Low (Flexible)</option>
                    <option value="normal">Normal (Standard)</option>
                    <option value="urgent">Urgent (Blocked Milestone)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-plum-700">
                    Self-Destruct Window
                  </label>
                  <select
                    value={needExpiryHours}
                    onChange={(e) => setNeedExpiryHours(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-plum-200 text-plum-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition"
                  >
                    <option value={2}>2 Hours (Flash alert)</option>
                    <option value={6}>6 Hours (Evening slot)</option>
                    <option value={12}>12 Hours (Hackathon shift)</option>
                    <option value={24}>24 Hours (Full day)</option>
                  </select>
                </div>
              </div>

              {/* Actions: Clear, Cancel, Submit Need */}
              <div className="pt-4 border-t border-plum-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={handleClearNeedForm}
                    leftIcon={<RotateCcw className="w-4 h-4 text-plum-500" />}
                    className="text-plum-600 hover:text-plum-900"
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  rightIcon={<Send className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Submit Need
                </Button>
              </div>
            </form>
          </div>

          {/* Side Info Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-3xl space-y-3 text-xs text-plum-700 leading-relaxed border border-plum-200 shadow-plum-sm">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Need-to-Action Guarantee</span>
              </div>
              <p>
                When published, this request is immediately evaluated by DropZone's deterministic
                matching engine. Matching candidates are ranked by skill compatibility, availability
                window, and current task capacity.
              </p>
              <div className="pt-2 border-t border-plum-100 space-y-1 text-[11px] text-plum-500 font-mono">
                <p>• Transparent 4-factor scoring</p>
                <p>• Zero public phone number exposure</p>
                <p>• Bilateral consent before private chat</p>
                <p>• Server-enforced expiry in {needExpiryHours}h</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl space-y-2 text-xs text-plum-600 border border-plum-200 shadow-plum-sm">
              <span className="font-bold text-plum-900 uppercase text-[10px] tracking-wider">
                ContextPass Policy
              </span>
              <p>
                Only verified members of the active event zone will be able to see this request or
                collaborate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PUBLISH HELPER OFFER */}
      {activeTab === 'offer' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-plum-900 brand-font flex items-center gap-2">
              <span>Publish Your Availability & Skills</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-plum-100 text-plum-800 border border-plum-200">
                Peer Helper Mode
              </span>
            </h3>
            <p className="text-xs text-plum-600">
              Make yourself searchable to fellow participants who need your specific technical
              superpowers.
            </p>
          </div>

          {/* Voice Input for Offer */}
          <div className="rounded-2xl border border-plum-200 bg-plum-50/70 p-5 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-2xl transition-all ${
                    isListening && activeSpeechTargetRef.current === 'offer'
                      ? 'bg-rose-100 text-rose-600 border border-rose-300 animate-pulse'
                      : 'bg-white text-plum-700 border border-plum-200'
                  }`}
                >
                  {isListening && activeSpeechTargetRef.current === 'offer' ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-plum-900 flex items-center gap-2">
                    <span>Voice Skill Input</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-plum-100 text-plum-800 border border-plum-200">
                      Web Speech API
                    </span>
                  </h3>
                  <p className="text-[11px] text-plum-600">
                    Speak your skills (e.g. "React, Docker, Python, UI Design") to stream into the input field below.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={isListening && activeSpeechTargetRef.current === 'offer' ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => toggleListening('offer')}
                  leftIcon={
                    isListening && activeSpeechTargetRef.current === 'offer' ? (
                      <MicOff className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )
                  }
                  className={
                    isListening && activeSpeechTargetRef.current === 'offer'
                      ? 'border-rose-300 text-rose-700 bg-rose-50'
                      : ''
                  }
                >
                  {isListening && activeSpeechTargetRef.current === 'offer'
                    ? 'Stop Listening'
                    : 'Start Speaking'}
                </Button>
              </div>
            </div>

            {/* Speech Error / Unsupported Notice */}
            {speechError && activeSpeechTargetRef.current === 'offer' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{speechError}</span>
              </div>
            )}

            {isListening && activeSpeechTargetRef.current === 'offer' && (
              <div className="flex items-center gap-1.5 text-rose-600 text-xs animate-pulse font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Listening... speak skills (streaming into skill field)</span>
              </div>
            )}
          </div>

          <form onSubmit={handleOfferSubmit} className="space-y-6" noValidate>
            {/* Zone Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-plum-700">
                Event Zone <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedZoneId(newId);
                  setFieldErrors((prev) => ({ ...prev, zone: '' }));
                  const matched = zones.find((z) => (z._id || (z as any).id) === newId);
                  if (matched) setCurrentZone(matched);
                }}
                className={`w-full bg-white border ${
                  fieldErrors.zone ? 'border-rose-500 ring-1 ring-rose-300' : 'border-plum-200'
                } text-plum-900 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition`}
              >
                {zones.map((z) => {
                  const zid = z._id || (z as any).id;
                  return (
                    <option key={zid} value={zid}>
                      {z.name} ({z.type.toUpperCase()} • {z.radiusMeters || z.radius || 450}m perimeter)
                    </option>
                  );
                })}
              </select>
              {fieldErrors.zone && (
                <p className="text-rose-600 text-xs mt-1 animate-fadeIn">{fieldErrors.zone}</p>
              )}
            </div>

            {/* Skills Tag Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-plum-700">
                Skills You Can Help With <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Python, Docker, React, Tailwind CSS, Figma"
                  value={offerSkillInput}
                  onChange={(e) => setOfferSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOfferSkill(offerSkillInput);
                    }
                  }}
                  className={`flex-1 bg-white border ${
                    fieldErrors.skills ? 'border-rose-500 ring-1 ring-rose-300' : 'border-plum-200'
                  } text-plum-900 placeholder-plum-400 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition`}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => addOfferSkill(offerSkillInput)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {offerSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-plum-100 border border-plum-200 text-plum-900 text-xs font-mono font-semibold"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => removeOfferSkill(s)}
                      className="text-plum-500 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {fieldErrors.skills && (
                <p className="text-rose-600 text-xs mt-1 animate-fadeIn">{fieldErrors.skills}</p>
              )}
            </div>

            {/* Availability Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-plum-700">
                  Available Time Window
                </label>
                <select
                  value={offerAvailability}
                  onChange={(e) => setOfferAvailability(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-plum-200 text-plum-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition"
                >
                  <option value={60}>1 Hour available</option>
                  <option value={120}>2 Hours available</option>
                  <option value={180}>3 Hours available</option>
                  <option value={240}>4 Hours available</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-plum-700">
                  Offer Active Retention Window
                </label>
                <select
                  value={offerExpiryHours}
                  onChange={(e) => setOfferExpiryHours(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-plum-200 text-plum-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition"
                >
                  <option value={4}>4 Hours (Evening sprint)</option>
                  <option value={8}>8 Hours (Overnight)</option>
                  <option value={12}>12 Hours (Full shift)</option>
                </select>
              </div>
            </div>

            {/* Actions: Clear, Cancel, Submit Offer CTA */}
            <div className="pt-4 border-t border-plum-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleClearOfferForm}
                  leftIcon={<RotateCcw className="w-4 h-4 text-plum-500" />}
                  className="text-plum-600 hover:text-plum-900"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Submit Offer
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Match Discovery Modal triggered upon Need creation */}
      {createdNeed && (
        <MatchDiscoveryModal
          isOpen={isMatchModalOpen}
          onClose={() => {
            setIsMatchModalOpen(false);
            navigate('/dashboard');
          }}
          need={createdNeed}
        />
      )}
    </div>
  );
};

export default CreatePostPage;
