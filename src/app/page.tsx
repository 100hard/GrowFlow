'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Store,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Layers,
  Calendar,
  Coffee,
  Plus,
  Trash2,
  Info,
  Sliders,
  Send,
  MessageSquare,
  FileText,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  calculateContributionEconomics,
  evaluateFeasibilityRules,
  DEFAULT_LOW_MARGIN_THRESHOLD_PERCENT,
} from '../lib/economics';
import { generateInitialChecklist, recalculateChecklistTimes } from '../lib/checklist';
import { logEvent, getLiveEvents, calculateFunnelMetrics, generateSimulatedBenchmarkCohort } from '../lib/analytics';
import {
  CAFE_REGRESSION_FIXTURE,
  AUTO_DETAILING_FIXTURE,
  BOOKSTORE_FIXTURE,
  ALL_FIXTURES,
  BusinessScenarioFixture,
} from '../lib/fixtures';
import type {
  BusinessProfile,
  CampaignObjectiveConfig,
  MarketingObjectiveType,
  BusinessReach,
  OfferingItem,
  CampaignBrief,
  ChecklistMilestone,
  AnalyticsEvent,
  FunnelAnalysisResult,
} from '../lib/types';

export default function GrowthFlowPage() {
  // Session initialization
  const [sessionId, setSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'studio' | 'analytics'>('studio');
  const [variant, setVariant] = useState<'progressive_wizard' | 'single_form'>('progressive_wizard');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Business Profile state (arbitrary small business)
  const [businessName, setBusinessName] = useState<string>(CAFE_REGRESSION_FIXTURE.profile.businessName);
  const [description, setDescription] = useState<string>(CAFE_REGRESSION_FIXTURE.profile.description);
  const [reach, setReach] = useState<BusinessReach>(CAFE_REGRESSION_FIXTURE.profile.reach);
  const [targetAudience, setTargetAudience] = useState<string>(CAFE_REGRESSION_FIXTURE.profile.targetAudience);
  const [offerings, setOfferings] = useState<OfferingItem[]>(CAFE_REGRESSION_FIXTURE.profile.offerings);

  // Marketing Objective state
  const [objectiveType, setObjectiveType] = useState<MarketingObjectiveType>(CAFE_REGRESSION_FIXTURE.objective.type);
  const [targetDays, setTargetDays] = useState<string>(CAFE_REGRESSION_FIXTURE.objective.targetWindow?.days || 'Tuesday & Wednesday');
  const [startTime, setStartTime] = useState<string>(CAFE_REGRESSION_FIXTURE.objective.targetWindow?.startTime || '14:00');
  const [endTime, setEndTime] = useState<string>(CAFE_REGRESSION_FIXTURE.objective.targetWindow?.endTime || '17:00');
  const [promoPrice, setPromoPrice] = useState<number>(CAFE_REGRESSION_FIXTURE.objective.promoPrice);
  const [additionalCost, setAdditionalCost] = useState<number>(CAFE_REGRESSION_FIXTURE.objective.additionalCost || 0.25);
  const [capacityUnits, setCapacityUnits] = useState<number | undefined>(CAFE_REGRESSION_FIXTURE.objective.availableCapacityUnits);
  const [targetRedemptions, setTargetRedemptions] = useState<number>(CAFE_REGRESSION_FIXTURE.objective.targetRedemptions || 10);
  const [budgetLimit, setBudgetLimit] = useState<number | undefined>(undefined);

  // Generation & Handoff state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief | null>(null);
  const [activeFormatTab, setActiveFormatTab] = useState<'social' | 'display' | 'direct'>('social');
  const [editableCaption, setEditableCaption] = useState<string>('');
  const [editableHeadline, setEditableHeadline] = useState<string>('');
  const [editableDirectMessage, setEditableDirectMessage] = useState<string>('');
  const [checklist, setChecklist] = useState<ChecklistMilestone[]>([]);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Analytics state
  const [analyticsCohort, setAnalyticsCohort] = useState<'live' | 'simulated'>('live');
  const [liveEventList, setLiveEventList] = useState<AnalyticsEvent[]>([]);

  // Initialize persistent session ID and start onboarding event
  useEffect(() => {
    let sId = window.sessionStorage.getItem('growflow_session_id');
    if (!sId) {
      sId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      window.sessionStorage.setItem('growflow_session_id', sId);
    }
    setSessionId(sId);
    setChecklist(generateInitialChecklist('14:00', reach, objectiveType));

    // Emit onboarding_started
    logEvent(sId, 'onboarding_started', { variant });
    refreshLiveEvents();
  }, []);

  // Update checklist when start time changes
  useEffect(() => {
    if (checklist.length > 0) {
      setChecklist((prev) => recalculateChecklistTimes(prev, startTime));
    }
  }, [startTime]);

  function refreshLiveEvents() {
    if (typeof window !== 'undefined') {
      const evts = getLiveEvents();
      setLiveEventList(evts);
    }
  }

  // Load a scenario fixture
  const handleLoadFixture = (fixture: BusinessScenarioFixture) => {
    setBusinessName(fixture.profile.businessName);
    setDescription(fixture.profile.description);
    setReach(fixture.profile.reach);
    setTargetAudience(fixture.profile.targetAudience);
    setOfferings(fixture.profile.offerings.map((o) => ({ ...o })));

    setObjectiveType(fixture.objective.type);
    if (fixture.objective.targetWindow) {
      setTargetDays(fixture.objective.targetWindow.days);
      setStartTime(fixture.objective.targetWindow.startTime);
      setEndTime(fixture.objective.targetWindow.endTime);
    }
    setPromoPrice(fixture.objective.promoPrice);
    setAdditionalCost(fixture.objective.additionalCost || 0);
    setCapacityUnits(fixture.objective.availableCapacityUnits);
    setTargetRedemptions(fixture.objective.targetRedemptions || 10);
    setBudgetLimit(fixture.objective.budgetLimit);

    setChecklist(generateInitialChecklist(fixture.objective.targetWindow?.startTime || '14:00', fixture.profile.reach, fixture.objective.type));
    setCurrentStep(1);
    setCampaignBrief(null);
  };

  // Construct current Objective config
  const currentObjectiveConfig: CampaignObjectiveConfig = useMemo(() => {
    return {
      type: objectiveType,
      label: objectiveType.replace(/_/g, ' ').toUpperCase(),
      description: `Drive volume via ${objectiveType.replace(/_/g, ' ')}`,
      targetWindow: {
        days: targetDays,
        startTime,
        endTime,
      },
      promoPrice,
      additionalCost,
      availableCapacityUnits: capacityUnits,
      targetRedemptions,
      budgetLimit,
    };
  }, [objectiveType, targetDays, startTime, endTime, promoPrice, additionalCost, capacityUnits, targetRedemptions, budgetLimit]);

  // Construct current Business profile
  const currentProfile: BusinessProfile = useMemo(() => {
    return {
      businessName,
      description,
      reach,
      targetAudience,
      offerings,
      preferredChannels: reach === 'service_area' ? ['direct_message', 'social_post'] : ['social_post', 'display_sign'],
    };
  }, [businessName, description, reach, targetAudience, offerings]);

  // Calculate composable feasibility report in real-time
  const feasibilityReport = useMemo(() => {
    return evaluateFeasibilityRules(offerings, currentObjectiveConfig, additionalCost);
  }, [offerings, currentObjectiveConfig, additionalCost]);

  // Extract unit contribution details
  const unitContributionDetails = useMemo(() => {
    return calculateContributionEconomics({
      items: offerings,
      packagingCost: additionalCost,
      promoPrice,
      extraPromoCost: 0,
    });
  }, [offerings, additionalCost, promoPrice]);

  // Handle adding/removing offerings
  const handleAddOffering = () => {
    const newItem: OfferingItem = {
      id: `offering-${Date.now()}`,
      name: 'Additional Product / Service',
      regularPrice: 20.0,
      variableCost: 5.0,
    };
    setOfferings([...offerings, newItem]);
  };

  const handleRemoveOffering = (id: string) => {
    if (offerings.length <= 1) return;
    setOfferings(offerings.filter((o) => o.id !== id));
  };

  const handleOfferingChange = (id: string, field: keyof OfferingItem, value: any) => {
    setOfferings(
      offerings.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Trigger campaign generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    logEvent(sessionId, 'campaign_generation_started', {
      objectiveType,
      rulesEvaluated: feasibilityReport.results.map((r) => r.ruleId),
      overallStatus: feasibilityReport.overallStatus,
    });
    refreshLiveEvents();

    try {
      const payload = {
        profile: currentProfile,
        objective: currentObjectiveConfig,
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Generation failed');
      }

      const data: CampaignBrief = await res.json();
      setCampaignBrief(data);
      setEditableCaption(data.formats.socialPost.caption);
      setEditableHeadline(data.formats.displaySign.headline);
      setEditableDirectMessage(data.formats.directMessage.messageBody);
      setCurrentStep(4); // Move to review step

      logEvent(sessionId, 'campaign_generated', {
        source: data.source,
        objectiveType: data.objectiveType,
      });
      refreshLiveEvents();
    } catch (err: any) {
      console.error(err);
      logEvent(sessionId, 'campaign_generation_failed', { error: err.message });
      refreshLiveEvents();
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(`Copied ${formatName} to clipboard!`);
    setTimeout(() => setCopyToast(null), 3000);

    logEvent(sessionId, 'materials_copied', { formatCopied: formatName });
    refreshLiveEvents();
  };

  // Handle campaign approval
  const handleApprove = () => {
    if (!campaignBrief) return;
    const updated = { ...campaignBrief, status: 'approved' as const };
    setCampaignBrief(updated);

    logEvent(sessionId, 'campaign_approved', {
      source: campaignBrief.source,
      wasEdited: editableCaption !== campaignBrief.formats.socialPost.caption,
    });
    refreshLiveEvents();
  };

  // Toggle checklist milestone
  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.isCompleted;
          logEvent(sessionId, 'checklist_milestone_toggled', {
            taskId: id,
            isCompleted: nextState,
          });
          refreshLiveEvents();
          return { ...item, isCompleted: nextState };
        }
        return item;
      })
    );
  };

  // Edit checklist item description
  const handleUpdateChecklistDesc = (id: string, newDesc: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description: newDesc } : item))
    );
  };

  // Computed metrics for active cohort
  const analyticsData: FunnelAnalysisResult = useMemo(() => {
    if (analyticsCohort === 'simulated') {
      const simEvents = generateSimulatedBenchmarkCohort();
      return calculateFunnelMetrics(simEvents);
    }
    return calculateFunnelMetrics(liveEventList);
  }, [analyticsCohort, liveEventList]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 flex items-center gap-2">
                GrowthFlow
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  v2.0 Generic Architect
                </span>
              </span>
              <p className="text-xs text-slate-500">Configuration-Driven Small Business Marketing Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('studio')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'studio'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Campaign Studio
              </button>
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  refreshLiveEvents();
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Analytics & Telemetry
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Copy Toast Alert */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        {activeTab === 'studio' ? (
          <div>
            {/* Header info & Sample Presets */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Small Business Promotional Campaign Planner
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Describe any small business, select an objective, verify composable feasibility rules, and generate multi-format copy.
                </p>
              </div>

              {/* Sample Fixtures Quick-Load */}
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Load Regression Scenario:
                </span>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                  {ALL_FIXTURES.map((fix) => (
                    <button
                      key={fix.id}
                      onClick={() => handleLoadFixture(fix)}
                      className="px-2.5 py-1 rounded hover:bg-slate-100 font-semibold text-slate-700 transition-all"
                      title={fix.industryCategory}
                    >
                      {fix.id === 'cafe_slump' && '☕ Café'}
                      {fix.id === 'auto_detailing' && '🚗 Auto Detail'}
                      {fix.id === 'bookstore_retail' && '📚 Bookstore'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PROGRESS BAR (Only if in Wizard mode and not in review step) */}
            {variant === 'progressive_wizard' && currentStep < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                  <span className={currentStep >= 1 ? 'text-emerald-700 font-bold' : ''}>
                    1. Business Profile & Context
                  </span>
                  <span className={currentStep >= 2 ? 'text-emerald-700 font-bold' : ''}>
                    2. Growth Objective & Timing
                  </span>
                  <span className={currentStep >= 3 ? 'text-emerald-700 font-bold' : ''}>
                    3. Offerings & Feasibility Checks
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* WORKFLOW SCREENS */}
            {currentStep < 4 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Inputs (Steps 1, 2, 3) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* STEP 1: Generic Business Profile */}
                  {(variant === 'single_form' || currentStep === 1) && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Store className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-semibold text-slate-900">Step 1: Business Profile & Reach</h2>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="e.g. Apex Mobile Detailing / The Daily Grind"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Natural Language Business Description (No Fixed Dropdown)
                        </label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="Describe what your business does, who you serve, and your unique approach..."
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Describe any business: food, trade service, boutique fitness, tutoring, retail, etc.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Geographic / Online Reach
                          </label>
                          <select
                            value={reach}
                            onChange={(e) => setReach(e.target.value as BusinessReach)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="local_foot_traffic">Local Walk-in / Foot Traffic</option>
                            <option value="service_area">Service Area / Mobile (On-site)</option>
                            <option value="online_nationwide">Online / Regional Delivery</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Target Customers
                          </label>
                          <input
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="e.g. Busy homeowners, students, commuters"
                          />
                        </div>
                      </div>

                      {variant === 'progressive_wizard' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              setCurrentStep(2);
                              logEvent(sessionId, 'profile_configured', {
                                businessName,
                                reach,
                                targetAudience,
                              });
                              refreshLiveEvents();
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm"
                          >
                            Next: Select Marketing Objective
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 2: Marketing Objective */}
                  {(variant === 'single_form' || currentStep === 2) && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Layers className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-semibold text-slate-900">Step 2: Select Growth Objective</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div
                          onClick={() => setObjectiveType('fill_capacity')}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            objectiveType === 'fill_capacity'
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl mb-2 block">⏰⚡</span>
                          <h3 className="font-bold text-sm text-slate-900">Fill Idle Capacity</h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Monetize slow weekday hours, empty tables, or open appointment slots.
                          </p>
                        </div>

                        <div
                          onClick={() => setObjectiveType('acquire_new_customers')}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            objectiveType === 'acquire_new_customers'
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl mb-2 block">🎁👋</span>
                          <h3 className="font-bold text-sm text-slate-900">First-Time Customers</h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Lower purchase friction with an introductory hook to win new regulars.
                          </p>
                        </div>

                        <div
                          onClick={() => setObjectiveType('promote_bundle')}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            objectiveType === 'promote_bundle'
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl mb-2 block">📦🤝</span>
                          <h3 className="font-bold text-sm text-slate-900">Promote Bundle</h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Pair complementary products or services to raise transaction ticket value.
                          </p>
                        </div>
                      </div>

                      {/* Progressive Timing Inputs */}
                      <div className="grid grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Target Days
                          </label>
                          <input
                            type="text"
                            value={targetDays}
                            onChange={(e) => setTargetDays(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                            placeholder="Tuesday & Wednesday"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                          />
                        </div>
                      </div>

                      {variant === 'progressive_wizard' && (
                        <div className="pt-2 flex justify-between">
                          <button
                            onClick={() => setCurrentStep(1)}
                            className="px-3 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                          </button>
                          <button
                            onClick={() => {
                              setCurrentStep(3);
                              logEvent(sessionId, 'objective_selected', { objective: objectiveType });
                              refreshLiveEvents();
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm"
                          >
                            Next: Configure Offerings & Feasibility
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3: Offerings & Composable Feasibility Constraints */}
                  {(variant === 'single_form' || currentStep === 3) && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          <h2 className="font-semibold text-slate-900">Step 3: Offerings, Costs & Constraints</h2>
                        </div>
                        <button
                          onClick={handleAddOffering}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Item / Service
                        </button>
                      </div>

                      {/* Offerings Table */}
                      <div className="space-y-3">
                        {offerings.map((item, index) => (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-3 items-start md:items-center"
                          >
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Item / Service #{index + 1}
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleOfferingChange(item.id, 'name', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
                                placeholder="Service or product name"
                              />
                            </div>
                            <div className="w-28">
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Reg. Price ($)
                              </label>
                              <input
                                type="number"
                                step="0.50"
                                value={item.regularPrice}
                                onChange={(e) =>
                                  handleOfferingChange(item.id, 'regularPrice', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
                              />
                            </div>
                            <div className="w-28">
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Unit Cost ($)
                              </label>
                              <input
                                type="number"
                                step="0.50"
                                value={item.variableCost ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                  handleOfferingChange(item.id, 'variableCost', isNaN(val as any) ? null : val);
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
                                placeholder="Direct cost"
                              />
                            </div>
                            {offerings.length > 1 && (
                              <button
                                onClick={() => handleRemoveOffering(item.id)}
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded self-end md:self-center"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Pricing & Composable Constraints */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-emerald-800 mb-1">
                            Promotional Offer Price ($) *
                          </label>
                          <input
                            type="number"
                            step="0.50"
                            value={promoPrice}
                            onChange={(e) => setPromoPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border-2 border-emerald-500 rounded-lg text-sm font-bold text-slate-900 bg-white"
                            placeholder="e.g. 19.50"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Baseline Regular Value:{' '}
                            <span className="font-semibold text-slate-700">
                              ${offerings.reduce((s, i) => s + i.regularPrice, 0).toFixed(2)}
                            </span>
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Available Capacity (Slots / Seats)
                          </label>
                          <input
                            type="number"
                            value={capacityUnits ?? ''}
                            onChange={(e) => setCapacityUnits(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                            placeholder="e.g. 6 appointment slots, 20 tables"
                          />
                          <p className="text-xs text-slate-500 mt-1">Used by capacity constraint check</p>
                        </div>
                      </div>

                      {/* Navigation buttons */}
                      <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                        {variant === 'progressive_wizard' ? (
                          <button
                            onClick={() => setCurrentStep(2)}
                            className="px-3 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                          </button>
                        ) : (
                          <div />
                        )}

                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating || promoPrice <= 0}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg flex items-center gap-2 shadow-md transition-all"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Running Pluggable Checks...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate Campaign Brief
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: COMPOSABLE FEASIBILITY CHECKS PANEL */}
                <div className="lg:col-span-5">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-semibold text-slate-900">Extensible Feasibility Rules</h2>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
                        Composable Engine
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Deterministic verification modules executed based on explicit business inputs. Never invents costs or certifies profitability.
                    </p>

                    {/* RENDER PLUGGABLE RULE RESULTS */}
                    <div className="space-y-3">
                      {feasibilityReport.results.map((rule) => (
                        <div
                          key={rule.ruleId}
                          className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                            rule.status === 'critical_alert'
                              ? 'bg-red-50 border-red-200 text-red-900'
                              : rule.status === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : rule.status === 'missing_inputs'
                              ? 'bg-slate-100 border-slate-200 text-slate-700'
                              : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{rule.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                                rule.status === 'critical_alert'
                                  ? 'bg-red-200 text-red-800'
                                  : rule.status === 'warning'
                                  ? 'bg-amber-200 text-amber-800'
                                  : rule.status === 'missing_inputs'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-200 text-emerald-800'
                              }`}
                            >
                              {rule.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="leading-relaxed">{rule.summary}</p>
                        </div>
                      ))}
                    </div>

                    {/* Unit Contribution Metrics Detail */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Regular Offering Value:</span>
                        <span className="font-semibold text-slate-900">${unitContributionDetails.baselinePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Total Variable Costs:</span>
                        <span className="font-semibold text-slate-900">
                          {unitContributionDetails.totalVariableCost !== null
                            ? `$${unitContributionDetails.totalVariableCost.toFixed(2)}`
                            : 'Omitted'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 bg-slate-50 px-2 rounded">
                        <span className="text-slate-700 font-medium">Promo Unit Contribution:</span>
                        <span
                          className={`font-bold ${
                            unitContributionDetails.hasNegativeContribution ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {unitContributionDetails.promoContribution !== null
                            ? `$${unitContributionDetails.promoContribution.toFixed(2)}`
                            : 'Unavailable'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Breakeven Volume Multiplier:</span>
                        <span
                          className={`font-mono font-bold ${
                            unitContributionDetails.breakevenMultiplier === 'non_viable'
                              ? 'text-red-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {typeof unitContributionDetails.breakevenMultiplier === 'number'
                            ? `${unitContributionDetails.breakevenMultiplier}x`
                            : unitContributionDetails.breakevenMultiplier}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* STEP 4: CAMPAIGN BRIEF REVIEW, MULTI-FORMAT COPY & DELIBERATE HANDOFF */
              campaignBrief && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Status & Action Bar */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{campaignBrief.customerHook}</h2>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            campaignBrief.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {campaignBrief.status === 'approved' ? 'Approved & Ready' : 'Draft Brief'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {campaignBrief.source === 'llm' ? 'Live LLM' : 'Verified Deterministic'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Business: <span className="font-semibold text-slate-700">{businessName}</span> • Objective:{' '}
                        <span className="font-semibold text-slate-700">{objectiveType.replace(/_/g, ' ')}</span> • Promo Price:{' '}
                        <span className="font-bold text-emerald-700">${promoPrice.toFixed(2)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-3 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Modify Inputs
                      </button>

                      <button
                        onClick={handleApprove}
                        className={`px-5 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all ${
                          campaignBrief.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {campaignBrief.status === 'approved' ? 'Campaign Approved' : 'Mark as Approved'}
                      </button>
                    </div>
                  </div>

                  {/* Strategic Rationale Card */}
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                      Strategic Rationale
                    </span>
                    <p className="text-sm text-emerald-950 leading-relaxed">{campaignBrief.strategicRationale}</p>
                  </div>

                  {/* THREE ACTIONABLE OUTPUT FORMATS */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Format Tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
                      <button
                        onClick={() => setActiveFormatTab('social')}
                        className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                          activeFormatTab === 'social'
                            ? 'border-emerald-600 text-emerald-700 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>📸</span>
                        Format 1: Social Media Post
                      </button>
                      <button
                        onClick={() => setActiveFormatTab('display')}
                        className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                          activeFormatTab === 'display'
                            ? 'border-emerald-600 text-emerald-700 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🖍️</span>
                        Format 2: Physical / Counter Sign
                      </button>
                      <button
                        onClick={() => setActiveFormatTab('direct')}
                        className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                          activeFormatTab === 'direct'
                            ? 'border-emerald-600 text-emerald-700 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>💬</span>
                        Format 3: Direct Message / SMS
                      </button>
                    </div>

                    <div className="p-6">
                      {/* FORMAT 1: SOCIAL POST */}
                      {activeFormatTab === 'social' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              In-Line Editable Social Caption
                            </span>
                            <button
                              onClick={() => handleCopy(editableCaption, 'Social Media Caption')}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Caption
                            </button>
                          </div>

                          <textarea
                            value={editableCaption}
                            onChange={(e) => setEditableCaption(e.target.value)}
                            rows={7}
                            className="w-full p-4 border border-slate-300 rounded-lg text-sm text-slate-800 leading-relaxed font-sans focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-xs font-bold text-slate-700 block mb-1">
                                Photo / Visual Direction
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {campaignBrief.formats.socialPost.photoDirection}
                              </p>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-xs font-bold text-slate-700 block mb-1">
                                Recommended Hashtags
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {campaignBrief.formats.socialPost.hashtags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FORMAT 2: DISPLAY / CHALKBOARD SIGN */}
                      {activeFormatTab === 'display' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Display / Sidewalk Sign Spec
                            </span>
                            <button
                              onClick={() => {
                                const fullChalkText = `${editableHeadline}\n\n${campaignBrief.formats.displaySign.bulletPoints.map((b) => `• ${b}`).join('\n')}\n\n${campaignBrief.formats.displaySign.timeCallout}`;
                                handleCopy(fullChalkText, 'Display Sign Spec');
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Sign Spec
                            </button>
                          </div>

                          <div className="p-6 bg-slate-900 text-white rounded-xl shadow-inner font-sans border-4 border-slate-700 max-w-lg mx-auto text-center space-y-4">
                            <input
                              type="text"
                              value={editableHeadline}
                              onChange={(e) => setEditableHeadline(e.target.value)}
                              className="bg-transparent border-b border-dashed border-slate-600 text-center font-black tracking-widest text-xl text-yellow-300 w-full focus:outline-none"
                            />

                            <div className="space-y-1.5 py-2">
                              {campaignBrief.formats.displaySign.bulletPoints.map((point, idx) => (
                                <p key={idx} className="text-sm font-semibold tracking-wide text-slate-100">
                                  ★ {point}
                                </p>
                              ))}
                            </div>

                            <p className="text-xs text-emerald-400 font-mono tracking-wider">
                              ⏰ {campaignBrief.formats.displaySign.timeCallout}
                            </p>

                            <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-800">
                              Placement Tip: {campaignBrief.formats.displaySign.displayTip}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* FORMAT 3: DIRECT MESSAGE / OUTREACH */}
                      {activeFormatTab === 'direct' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Direct Outreach Script (SMS / WhatsApp / Client Message)
                            </span>
                            <button
                              onClick={() => handleCopy(editableDirectMessage, 'Direct Outreach Message')}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Message
                            </button>
                          </div>

                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
                            <strong>Subject / Hook:</strong> {campaignBrief.formats.directMessage.hook}
                          </div>

                          <textarea
                            value={editableDirectMessage}
                            onChange={(e) => setEditableDirectMessage(e.target.value)}
                            rows={5}
                            className="w-full p-4 border border-slate-300 rounded-lg text-sm text-slate-800 leading-relaxed font-sans focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />

                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                            <strong>Call to Action:</strong> {campaignBrief.formats.directMessage.callToAction}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DELIBERATE HANDOFF: TIME-RELATIVE OPERATIONAL CHECKLIST */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-slate-900">
                          Operational Store & Service Launch Checklist (Relative to {startTime})
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Launch Starts At:</span>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      {checklist.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-lg border transition-all flex items-start gap-3 ${
                            task.isCompleted
                              ? 'bg-emerald-50/50 border-emerald-200 text-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => handleToggleChecklist(task.id)}
                            className="mt-1 h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                                {task.timeString}
                              </span>
                              <strong className={`text-sm ${task.isCompleted ? 'line-through text-slate-500' : ''}`}>
                                {task.title}
                              </strong>
                            </div>
                            <input
                              type="text"
                              value={task.description}
                              onChange={(e) => handleUpdateChecklistDesc(task.id, e.target.value)}
                              className="w-full text-xs text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational Caveats */}
                  <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
                    <strong className="block text-slate-900 font-bold mb-1">Operational Caveats & Constraints:</strong>
                    {campaignBrief.operationalCaveats.map((c, i) => (
                      <p key={i}>• {c}</p>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* ANALYTICS & TELEMETRY DASHBOARD TAB                     */
          /* ======================================================== */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Cohort Switcher */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Campaign Funnel & Product Telemetry</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Evaluates activation conversion, time-to-activate (Target: &lt; 180s), and economic guardrails.
                </p>
              </div>

              {/* Data Cohort Switcher */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setAnalyticsCohort('live')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    analyticsCohort === 'live'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Session Telemetry
                </button>
                <button
                  onClick={() => setAnalyticsCohort('simulated')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    analyticsCohort === 'simulated'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Simulated SMB Benchmark (N=250)
                </button>
              </div>
            </div>

            {/* Simulated Dataset Warning Badge */}
            {analyticsCohort === 'simulated' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-900 text-xs font-medium">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>SIMULATED BENCHMARK DATASET:</strong> This view renders 250 simulated small business sessions to
                  demonstrate funnel drop-off curves and cohort variance. It is strictly segregated from your live session.
                </span>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>LIVE SESSION TELEMETRY:</strong> Rendering actual events recorded in your browser session (
                  {liveEventList.length} events logged). Single-session evaluation is directional.
                </span>
              </div>
            )}

            {/* TOP METRIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activation Rate</span>
                <div className="text-2xl font-black text-slate-900">{analyticsData.activationRate}%</div>
                <p className="text-xs text-slate-500">
                  {analyticsData.activatedSessions} of {analyticsData.totalSessions} sessions approved
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Median Time to Activate
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {analyticsData.medianTimeToActivateSeconds !== null
                    ? `${analyticsData.medianTimeToActivateSeconds}s`
                    : 'N/A'}
                </div>
                <p className="text-xs text-slate-500">
                  Hypothesis target: &lt; 180s ({analyticsData.p75TimeToActivateSeconds ? `p75: ${analyticsData.p75TimeToActivateSeconds}s` : 'waiting for data'})
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Handoff Copy Rate</span>
                <div className="text-2xl font-black text-slate-900">{analyticsData.handoffCopyRate}%</div>
                <p className="text-xs text-slate-500">Approved sessions copying materials</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Negative Margin Interception
                </span>
                <div className="text-2xl font-black text-amber-600">
                  {analyticsData.negativeMarginAlertRate}%
                </div>
                <p className="text-xs text-slate-500">Sessions warned against losing cash</p>
              </div>
            </div>

            {/* LINEAR FUNNEL STAGES */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Linear Conversion Funnel</h3>
                <span className="text-xs text-slate-500">Linear path to activation across diverse SMB categories</span>
              </div>

              <div className="space-y-4">
                {analyticsData.funnelStages.map((stage, idx) => (
                  <div key={stage.stage} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{stage.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">{stage.count} sessions</span>
                        {idx > 0 && (
                          <span
                            className={`font-mono text-xs ${
                              stage.dropOffRate > 25 ? 'text-red-600' : 'text-slate-500'
                            }`}
                          >
                            Drop-off: {stage.dropOffRate}% (-{stage.dropOffCount})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            analyticsData.totalSessions > 0
                              ? (stage.count / analyticsData.totalSessions) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE EVENT LOG TABLE */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">
                  {analyticsCohort === 'live' ? 'Live Session Event Stream' : 'Simulated Sample Records'}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {analyticsCohort === 'live' ? `${liveEventList.length} events` : '250 simulated events'}
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Event Name</th>
                      <th className="p-2.5">Session ID</th>
                      <th className="p-2.5">Payload Properties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(analyticsCohort === 'live'
                      ? liveEventList.slice().reverse()
                      : generateSimulatedBenchmarkCohort().slice(0, 15)
                    ).map((evt) => (
                      <tr key={evt.eventId} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-2.5 font-bold text-emerald-800 font-mono">{evt.eventName}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{evt.sessionId.substring(0, 14)}...</td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px] truncate max-w-xs">
                          {JSON.stringify(evt.properties)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
