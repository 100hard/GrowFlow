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
  ExternalLink,
} from 'lucide-react';
import { calculateContributionEconomics, DEFAULT_LOW_MARGIN_THRESHOLD_PERCENT } from '../lib/economics';
import { generateInitialChecklist, recalculateChecklistTimes } from '../lib/checklist';
import { logEvent, getLiveEvents, calculateFunnelMetrics, generateSimulatedBenchmarkCohort } from '../lib/analytics';
import type {
  CampaignArchetype,
  IntakeScenarioInput,
  MenuItemInput,
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

  // Scenario state
  const [businessName, setBusinessName] = useState<string>('The Daily Grind Café & Bakehouse');
  const [neighborhoodVibe, setNeighborhoodVibe] = useState<string>('Cozy neighborhood spot near campus and creative offices');
  const [slumpDay, setSlumpDay] = useState<string>('Tuesday & Wednesday');
  const [slumpStartTime, setSlumpStartTime] = useState<string>('14:00');
  const [slumpEndTime, setSlumpEndTime] = useState<string>('17:00');
  const [archetype, setArchetype] = useState<CampaignArchetype>('bundle_hook');

  // Multi-item bundle state
  const [items, setItems] = useState<MenuItemInput[]>([
    { id: 'item-1', name: 'Oat Milk Honey Latte', regularPrice: 5.5, unitCost: 1.2 },
    { id: 'item-2', name: 'Fresh Cardamom Bun', regularPrice: 4.5, unitCost: 1.8 },
  ]);
  const [packagingCost, setPackagingCost] = useState<number>(0.25);
  const [promoPrice, setPromoPrice] = useState<number>(7.5);
  const [extraPromoCost, setExtraPromoCost] = useState<number>(0.0);

  // Generation & Handoff state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief | null>(null);
  const [activeFormatTab, setActiveFormatTab] = useState<'instagram' | 'chalkboard'>('instagram');
  const [editableCaption, setEditableCaption] = useState<string>('');
  const [editableChalkboardHeadline, setEditableChalkboardHeadline] = useState<string>('');
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
    setChecklist(generateInitialChecklist('14:00'));

    // Emit onboarding_started
    logEvent(sId, 'onboarding_started', { variant });
    refreshLiveEvents();
  }, []);

  // Update checklist when start time changes
  useEffect(() => {
    if (checklist.length > 0) {
      setChecklist((prev) => recalculateChecklistTimes(prev, slumpStartTime));
    }
  }, [slumpStartTime]);

  function refreshLiveEvents() {
    if (typeof window !== 'undefined') {
      const evts = getLiveEvents();
      setLiveEventList(evts);
    }
  }

  // Calculate deterministic contribution economics in real-time
  const economics = useMemo(() => {
    return calculateContributionEconomics({
      items,
      packagingCost,
      promoPrice,
      extraPromoCost,
    });
  }, [items, packagingCost, promoPrice, extraPromoCost]);

  // Log economics_calculated when step reaches review or prices change
  useEffect(() => {
    if (sessionId && currentStep === 3) {
      logEvent(sessionId, 'economics_calculated', {
        basePrice: economics.baselinePrice,
        promoPrice: economics.promoPrice,
        totalVarCost: economics.totalVariableCost,
        hasNegativeMargin: economics.hasNegativeContribution,
        contributionRate: economics.promoContributionRate,
      });
      refreshLiveEvents();
    }
  }, [currentStep]);

  // Handle adding an item to the bundle
  const handleAddItem = () => {
    const newItem: MenuItemInput = {
      id: `item-${Date.now()}`,
      name: 'Fresh Baked Treat',
      regularPrice: 4.0,
      unitCost: 1.5,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof MenuItemInput, value: any) => {
    setItems(
      items.map((item) => {
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
      archetype,
      hasNegativeMargin: economics.hasNegativeContribution,
    });
    refreshLiveEvents();

    try {
      const payload: IntakeScenarioInput = {
        businessName,
        neighborhoodVibe,
        slumpDay,
        slumpStartTime,
        slumpEndTime,
        archetype,
        items,
        packagingCost,
        promoPrice,
        extraPromoCost,
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
      setEditableCaption(data.instagram.caption);
      setEditableChalkboardHeadline(data.chalkboard.headline);
      setCurrentStep(4); // Move to review step

      logEvent(sessionId, 'campaign_generated', {
        source: data.source,
        archetype: data.archetype,
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
  const handleCopy = (text: string, format: 'instagram' | 'chalkboard') => {
    navigator.clipboard.writeText(text);
    setCopyToast(`Copied ${format === 'instagram' ? 'Instagram Caption' : 'Chalkboard Layout'} to clipboard!`);
    setTimeout(() => setCopyToast(null), 3000);

    logEvent(sessionId, 'materials_copied', { formatCopied: format });
    refreshLiveEvents();
  };

  // Handle caption edit
  const handleCaptionChange = (val: string) => {
    setEditableCaption(val);
    logEvent(sessionId, 'campaign_edited', {
      targetFormat: 'instagram',
      fieldModified: 'caption',
    });
    refreshLiveEvents();
  };

  // Handle campaign approval
  const handleApprove = () => {
    if (!campaignBrief) return;
    const updated = { ...campaignBrief, status: 'approved' as const };
    setCampaignBrief(updated);

    logEvent(sessionId, 'campaign_approved', {
      source: campaignBrief.source,
      wasEdited: editableCaption !== campaignBrief.instagram.caption,
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
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 flex items-center gap-2">
                GrowthFlow
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  v1.0 APM MVP
                </span>
              </span>
              <p className="text-xs text-slate-500">Off-Peak Campaign Architect for Independent Cafés</p>
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
            {/* Header info & A/B Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Weekday Afternoon Slump Campaign Planner
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Design a margin-safe bundle offer and generate local promotional copy for your café in under 3 minutes.
                </p>
              </div>

              {/* Experiment Variant Switcher */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">Flow Variant:</span>
                <button
                  onClick={() => setVariant('progressive_wizard')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    variant === 'progressive_wizard'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  3-Step Wizard
                </button>
                <button
                  onClick={() => setVariant('single_form')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    variant === 'single_form'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Single Form
                </button>
              </div>
            </div>

            {/* PROGRESS BAR (Only if in Wizard mode and not in review step) */}
            {variant === 'progressive_wizard' && currentStep < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                  <span className={currentStep >= 1 ? 'text-emerald-700 font-bold' : ''}>
                    1. Store & Slump Window
                  </span>
                  <span className={currentStep >= 2 ? 'text-emerald-700 font-bold' : ''}>
                    2. Campaign Strategy
                  </span>
                  <span className={currentStep >= 3 ? 'text-emerald-700 font-bold' : ''}>
                    3. Bundle & Economics
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
                  {/* STEP 1: Store & Timing */}
                  {(variant === 'single_form' || currentStep === 1) && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Store className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-semibold text-slate-900">Step 1: Store & Target Slump Period</h2>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Café / Bakery Name
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="e.g. Blue Door Café"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Neighborhood & Vibe
                        </label>
                        <input
                          type="text"
                          value={neighborhoodVibe}
                          onChange={(e) => setNeighborhoodVibe(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="e.g. Cozy local specialty coffee bar with regulars & students"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Slow Days
                          </label>
                          <input
                            type="text"
                            value={slumpDay}
                            onChange={(e) => setSlumpDay(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="Tuesday & Wednesday"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Slump Start Time
                          </label>
                          <input
                            type="time"
                            value={slumpStartTime}
                            onChange={(e) => setSlumpStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Slump End Time
                          </label>
                          <input
                            type="time"
                            value={slumpEndTime}
                            onChange={(e) => setSlumpEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {variant === 'progressive_wizard' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              setCurrentStep(2);
                              logEvent(sessionId, 'scenario_configured', {
                                businessName,
                                slumpDay,
                                slumpWindow: `${slumpStartTime}-${slumpEndTime}`,
                              });
                              refreshLiveEvents();
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm"
                          >
                            Next: Select Offer Strategy
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 2: Campaign Archetype */}
                  {(variant === 'single_form' || currentStep === 2) && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Layers className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-semibold text-slate-900">Step 2: Choose Campaign Archetype</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Option 1: Bundle Hook */}
                        <div
                          onClick={() => setArchetype('bundle_hook')}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            archetype === 'bundle_hook'
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl mb-2 block">☕🥐</span>
                          <h3 className="font-bold text-sm text-slate-900">The Bundle Hook</h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Pair a high-margin drink with fresh pastry. Clears day-of bake while safeguarding profit.
                          </p>
                        </div>

                        {/* Option 2: Remote Work Perk */}
                        <div
                          onClick={() => setArchetype('remote_work_perk')}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            archetype === 'remote_work_perk'
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl mb-2 block">💻✨</span>
                          <h3 className="font-bold text-sm text-slate-900">Remote Work Pass</h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Monetize dead tables with refill perks or afternoon focus snacks for work-from-home neighbors.
                          </p>
                        </div>

                        {/* Option 3: Neighbor 2-Pack */}
                        <div
                          onClick={() => setArchetype('neighbor_2pack')}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            archetype === 'neighbor_2pack'
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl mb-2 block">👥🤝</span>
                          <h3 className="font-bold text-sm text-slate-900">Bring a Colleague</h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Social 2-for deal to incentivize coffee runners to bring a friend during afternoon slump.
                          </p>
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
                              logEvent(sessionId, 'archetype_selected', { archetype });
                              refreshLiveEvents();
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm"
                          >
                            Next: Configure Bundle Economics
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3: Multi-item Bundle & Pricing */}
                  {(variant === 'single_form' || currentStep === 3) && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          <h2 className="font-semibold text-slate-900">Step 3: Bundle Items & Variable Costs</h2>
                        </div>
                        <button
                          onClick={handleAddItem}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Item to Bundle
                        </button>
                      </div>

                      {/* Item rows */}
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-3 items-start md:items-center"
                          >
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Item #{index + 1} Name
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
                                placeholder="Item name"
                              />
                            </div>
                            <div className="w-28">
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Reg. Price ($)
                              </label>
                              <input
                                type="number"
                                step="0.25"
                                value={item.regularPrice}
                                onChange={(e) =>
                                  handleItemChange(item.id, 'regularPrice', parseFloat(e.target.value) || 0)
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
                                step="0.10"
                                value={item.unitCost ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                  handleItemChange(item.id, 'unitCost', isNaN(val as any) ? null : val);
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
                                placeholder="e.g. 1.20"
                              />
                            </div>
                            {items.length > 1 && (
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded self-end md:self-center"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Packaging & Promotional Bundle Price */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Packaging & Consumables Cost ($)
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            value={packagingCost}
                            onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                            placeholder="Cups, napkins, sleeves"
                          />
                          <p className="text-xs text-slate-500 mt-1">Average \$0.20-\$0.40 per to-go order</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-emerald-800 mb-1">
                            Promotional Bundle Price ($) *
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            value={promoPrice}
                            onChange={(e) => setPromoPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border-2 border-emerald-500 rounded-lg text-sm font-bold text-slate-900 bg-white"
                            placeholder="e.g. 7.50"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Regular bundle total:{' '}
                            <span className="font-semibold text-slate-700">
                              ${economics.baselinePrice.toFixed(2)}
                            </span>
                          </p>
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
                          disabled={isGenerating || economics.promoPrice <= 0}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg flex items-center gap-2 shadow-md transition-all"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Structuring Margin-Safe Brief...
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

                {/* Right Column: DETERMINISTIC CONTRIBUTION ECONOMICS ENGINE */}
                <div className="lg:col-span-5">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-semibold text-slate-900">Unit Contribution Economics</h2>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
                        Deterministic Engine
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Evaluates gross margin contribution above direct variable ingredient and packaging costs. Does
                      not claim overall store net profit (which depends on fixed rent & staffing).
                    </p>

                    {/* ALERTS */}
                    {economics.hasNegativeContribution && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-800 text-xs">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                        <div>
                          <strong className="font-bold block">Negative Unit Contribution Alert!</strong>
                          Promotional price is below your total variable cost. Every unit sold loses cash ($
                          {Math.abs(economics.promoContribution ?? 0).toFixed(2)}). Breakeven volume is non-viable.
                        </div>
                      </div>
                    )}

                    {economics.hasThinMarginWarning && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-xs">
                        <Info className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <strong className="font-bold block">Low Contribution Rate Warning</strong>
                          Contribution rate is {economics.promoContributionRate}%, which is below the recommended 35%
                          safety threshold. Ensure your staff can handle volume.
                        </div>
                      </div>
                    )}

                    {economics.hasMissingCost && (
                      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg flex gap-3 text-slate-700 text-xs">
                        <Info className="w-5 h-5 text-slate-500 shrink-0" />
                        <div>
                          <strong className="font-bold block">Unit Costs Omitted</strong>
                          Contribution economics cannot be verified without item costs. Typical café COGS ranges
                          between 25% and 35%.
                        </div>
                      </div>
                    )}

                    {/* Calculation Metrics Breakdown */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                        <span className="text-slate-600">Regular Bundle Value:</span>
                        <span className="font-semibold text-slate-900">${economics.baselinePrice.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                        <span className="text-slate-600">Total Variable Cost (COGS + Packaging):</span>
                        <span className="font-semibold text-slate-900">
                          {economics.totalVariableCost !== null
                            ? `$${economics.totalVariableCost.toFixed(2)}`
                            : 'Omitted'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                        <span className="text-slate-600">Promotional Bundle Price:</span>
                        <span className="font-bold text-emerald-700">${economics.promoPrice.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100 bg-slate-50 px-2 rounded">
                        <span className="text-slate-700 font-medium">Promo Unit Contribution ($):</span>
                        <span
                          className={`font-bold ${
                            economics.hasNegativeContribution ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {economics.promoContribution !== null
                            ? `$${economics.promoContribution.toFixed(2)}`
                            : 'Unavailable'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                        <span className="text-slate-600">Promo Contribution Rate (%):</span>
                        <span className="font-bold text-slate-900">
                          {economics.promoContributionRate !== null
                            ? `${economics.promoContributionRate}%`
                            : 'Unavailable'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm py-1">
                        <span className="text-slate-600">Breakeven Volume Multiplier:</span>
                        <span
                          className={`font-mono font-bold ${
                            economics.breakevenMultiplier === 'non_viable'
                              ? 'text-red-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {typeof economics.breakevenMultiplier === 'number'
                            ? `${economics.breakevenMultiplier}x`
                            : economics.breakevenMultiplier === 'non_viable'
                            ? 'Non-viable'
                            : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Educational Explainer */}
                    <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                      <strong>Volume Breakeven Explanation:</strong>
                      {typeof economics.breakeven10SalesVolume === 'number' ? (
                        <p className="mt-1">
                          You need to sell <span className="font-bold text-slate-900">{economics.breakeven10SalesVolume} promotional bundles</span> during the slump to generate the same gross contribution that 10 regular-price sales would produce.
                        </p>
                      ) : (
                        <p className="mt-1">
                          Breakeven volume modeling requires positive unit contribution and entered ingredient costs.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* STEP 4: CAMPAIGN BRIEF REVIEW, EDITING & DELIBERATE HANDOFF */
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
                          {campaignBrief.source === 'llm' ? 'Live LLM' : 'Verified Offline Template'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Campaign Window: <span className="font-medium text-slate-700">{slumpDay} ({slumpStartTime} - {slumpEndTime})</span> • Promo Price:{' '}
                        <span className="font-bold text-emerald-700">${promoPrice.toFixed(2)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-3 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Modify Offer
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

                  {/* TWO ACTIONABLE OUTPUT FORMATS */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Format Tabs */}
                    <div className="flex border-b border-slate-200 bg-slate-50">
                      <button
                        onClick={() => setActiveFormatTab('instagram')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                          activeFormatTab === 'instagram'
                            ? 'border-emerald-600 text-emerald-700 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>📸</span>
                        Format A: Organic Instagram Caption
                      </button>
                      <button
                        onClick={() => setActiveFormatTab('chalkboard')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                          activeFormatTab === 'chalkboard'
                            ? 'border-emerald-600 text-emerald-700 bg-white'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🖍️</span>
                        Format B: Sidewalk Chalkboard Sign
                      </button>
                    </div>

                    <div className="p-6">
                      {activeFormatTab === 'instagram' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              In-Line Editable Post Caption
                            </span>
                            <button
                              onClick={() => handleCopy(editableCaption, 'instagram')}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Caption
                            </button>
                          </div>

                          <textarea
                            value={editableCaption}
                            onChange={(e) => handleCaptionChange(e.target.value)}
                            rows={8}
                            className="w-full p-4 border border-slate-300 rounded-lg text-sm text-slate-800 leading-relaxed font-sans focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-xs font-bold text-slate-700 block mb-1">
                                Suggested Photo Angle
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {campaignBrief.instagram.photoDirection}
                              </p>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-xs font-bold text-slate-700 block mb-1">
                                Recommended Local Hashtags
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {campaignBrief.instagram.hashtags.map((tag, idx) => (
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
                      ) : (
                        /* CHALKBOARD FORMAT */
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Sidewalk Chalkboard Spec & Visual Layout
                            </span>
                            <button
                              onClick={() => {
                                const fullChalkText = `${editableChalkboardHeadline}\n\n${campaignBrief.chalkboard.bulletPoints.map((b) => `• ${b}`).join('\n')}\n\n${campaignBrief.chalkboard.timeCallout}`;
                                handleCopy(fullChalkText, 'chalkboard');
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Chalkboard Spec
                            </button>
                          </div>

                          <div className="p-6 bg-slate-900 text-white rounded-xl shadow-inner font-sans border-4 border-slate-700 max-w-lg mx-auto text-center space-y-4">
                            <input
                              type="text"
                              value={editableChalkboardHeadline}
                              onChange={(e) => setEditableChalkboardHeadline(e.target.value)}
                              className="bg-transparent border-b border-dashed border-slate-600 text-center font-black tracking-widest text-xl text-yellow-300 w-full focus:outline-none"
                            />

                            <div className="space-y-1.5 py-2">
                              {campaignBrief.chalkboard.bulletPoints.map((point, idx) => (
                                <p key={idx} className="text-sm font-semibold tracking-wide text-slate-100">
                                  ★ {point}
                                </p>
                              ))}
                            </div>

                            <p className="text-xs text-emerald-400 font-mono tracking-wider">
                              ⏰ {campaignBrief.chalkboard.timeCallout}
                            </p>

                            <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-800">
                              Art Tip: {campaignBrief.chalkboard.drawingTip}
                            </p>
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
                          Operational Store Launch Checklist (Relative to {slumpStartTime})
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Slump Starts At:</span>
                        <input
                          type="time"
                          value={slumpStartTime}
                          onChange={(e) => setSlumpStartTime(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-500">
                      Times are automatically calculated relative to your campaign start time. Tasks are editable by
                      the owner.
                    </p>

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
                    <strong className="block text-slate-900 font-bold mb-1">Operational Caveats & Guardrails:</strong>
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
                  <strong>SIMULATED BENCHMARK DATASET:</strong> This view renders 250 simulated café sessions to
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
                <span className="text-xs text-slate-500">Linear path to activation (Editing is non-linear)</span>
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
