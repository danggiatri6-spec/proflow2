
import React, { useState, useEffect, useRef } from 'react';
import { generateGoalDescription, generateStepSolution, getCacheKey } from './services/geminiService';
import { GoalDescription, AppState, AiSettings, HistoryItem, SupportedLanguage } from './types';

// Fixed TypeScript global declaration to match environment's predefined aistudio property.
// Moving the interface inside declare global ensures correct type scoping and 'readonly' matches system modifiers.
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const LANGUAGES: SupportedLanguage[] = ['English', 'Chinese', 'Japanese', 'Spanish', 'French'];

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    appTitle: 'Goal Canvas',
    workspace: 'Workspace',
    toggleHistory: 'Toggle History',
    aiSettings: 'AI Settings',
    configuration: 'Configuration',
    preferredLanguage: 'Preferred Language',
    engineModel: 'Engine Model',
    flashModel: 'Flash (Fast)',
    proModel: 'Pro (Complex)',
    customPersona: 'Custom AI Persona',
    personaPlaceholder: 'e.g., Focus on scientific evidence...',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    saveSettings: 'Save Settings',
    pastGoals: 'Past Goals',
    noHistory: 'No history yet.',
    objective: 'Objective',
    inputPlaceholder: 'What do you want to achieve?',
    generateRoadmap: 'Generate Roadmap',
    processing: 'Processing...',
    actionSteps: 'Action Steps',
    detailedGuide: 'Detailed Guide',
    consultingAdvisor: 'Consulting Expert Advisor...',
    activeStep: 'Active Step',
    planningOutput: 'Planning output...',
    importSuccess: 'History imported successfully!',
    importError: 'Invalid file format.',
  },
  Chinese: {
    appTitle: '目标画布',
    workspace: '工作区',
    toggleHistory: '切换历史',
    aiSettings: 'AI 设置',
    configuration: '配置',
    preferredLanguage: '首选语言',
    engineModel: '模型引擎',
    flashModel: 'Flash (极速)',
    proModel: 'Pro (深度)',
    customPersona: '自定义 AI 角色',
    personaPlaceholder: '例如：专注于科学证据，语气严谨...',
    exportJson: '导出 JSON',
    importJson: '导入 JSON',
    saveSettings: '保存设置',
    pastGoals: '历史目标',
    noHistory: '暂无历史记录',
    objective: '目标核心',
    inputPlaceholder: '您想要达成什么目标？',
    generateRoadmap: '生成路线图',
    processing: '处理中...',
    actionSteps: '行动步骤',
    detailedGuide: '详细指南',
    consultingAdvisor: '正在咨询专家顾问...',
    activeStep: '当前步骤',
    planningOutput: '正在规划输出...',
    importSuccess: '历史记录导入成功！',
    importError: '无效的文件格式。',
  },
  Japanese: {
    appTitle: '目標キャンバス',
    workspace: 'ワークスペース',
    toggleHistory: '履歴の切り替え',
    aiSettings: 'AI 設定',
    configuration: '設定',
    preferredLanguage: '希望の言語',
    engineModel: 'エンジンモデル',
    flashModel: 'Flash (高速)',
    proModel: 'Pro (高度)',
    customPersona: 'カスタム AI ペルソナ',
    personaPlaceholder: '例：科学的根拠に焦点を当てる...',
    exportJson: 'JSONをエクスポート',
    importJson: 'JSONをインポート',
    saveSettings: '設定を保存',
    pastGoals: '過去の目標',
    noHistory: '履歴はまだありません。',
    objective: '目標',
    inputPlaceholder: '何を達成したいですか？',
    generateRoadmap: 'ロードマップを作成',
    processing: '処理中...',
    actionSteps: 'アクションステップ',
    detailedGuide: '詳細ガイド',
    consultingAdvisor: '専門アドバイザーに相談中...',
    activeStep: '進行中のステップ',
    planningOutput: '計画を出力中...',
    importSuccess: '履歴が正常にインポートされました。',
    importError: '無効なファイル形式です。',
  },
  Spanish: {
    appTitle: 'Lienzo de Objetivos',
    workspace: 'Espacio de trabajo',
    toggleHistory: 'Ver historial',
    aiSettings: 'Ajustes de IA',
    configuration: 'Configuración',
    preferredLanguage: 'Idioma preferido',
    engineModel: 'Modelo de motor',
    flashModel: 'Flash (Rápido)',
    proModel: 'Pro (Complejo)',
    customPersona: 'Persona de IA personalizada',
    personaPlaceholder: 'Ej. Centrarse en evidencia científica...',
    exportJson: 'Exportar JSON',
    importJson: 'Importar JSON',
    saveSettings: 'Guardar ajustes',
    pastGoals: 'Objetivos pasados',
    noHistory: 'Aún no hay historial.',
    objective: 'Objetivo',
    inputPlaceholder: '¿Qué quieres lograr?',
    generateRoadmap: 'Generar hoja de ruta',
    processing: 'Procesando...',
    actionSteps: 'Pasos de acción',
    detailedGuide: 'Guía detallada',
    consultingAdvisor: 'Consultando asesor experto...',
    activeStep: 'Paso activo',
    planningOutput: 'Planificando salida...',
    importSuccess: '¡Historial importado con éxito!',
    importError: 'Formato de archivo no válido.',
  },
  French: {
    appTitle: 'Canevas d\'Objectifs',
    workspace: 'Espace de travail',
    toggleHistory: 'Historique',
    aiSettings: 'Paramètres IA',
    configuration: 'Configuration',
    preferredLanguage: 'Langue préférée',
    engineModel: 'Modèle de moteur',
    flashModel: 'Flash (Rapide)',
    proModel: 'Pro (Complexe)',
    customPersona: 'Persona IA personnalisé',
    personaPlaceholder: 'Ex. Se concentrer sur les preuves scientifiques...',
    exportJson: 'Exporter JSON',
    importJson: 'Importer JSON',
    saveSettings: 'Enregistrer',
    pastGoals: 'Objectifs passés',
    noHistory: 'Pas encore d\'historique.',
    objective: 'Objectif',
    inputPlaceholder: 'Que voulez-vous accomplir ?',
    generateRoadmap: 'Générer la feuille de route',
    processing: 'Traitement...',
    actionSteps: 'Étapes d\'action',
    detailedGuide: 'Guide détaillé',
    consultingAdvisor: 'Consultation d\'un expert...',
    activeStep: 'Étape active',
    planningOutput: 'Planification de la sortie...',
    importSuccess: 'Historique importé avec succès !',
    importError: 'Format de fichier non valide.',
  }
};

const Header: React.FC<{ 
  onOpenSettings: () => void;
  onToggleHistory: () => void;
  isHistoryVisible: boolean;
  t: Record<string, string>;
}> = ({ onOpenSettings, onToggleHistory, isHistoryVisible, t }) => (
  <header className="py-4 px-8 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm z-10">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-indigo-600 rounded-lg text-white">
        <i className="fas fa-columns text-xl"></i>
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{t.appTitle}</h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.workspace}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={onToggleHistory}
        className={`p-2.5 rounded-xl transition-all border ${
          isHistoryVisible 
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
        }`}
        title={t.toggleHistory}
      >
        <i className="fas fa-history"></i>
      </button>
      <button 
        onClick={onOpenSettings}
        className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-all border border-slate-200"
        title={t.aiSettings}
      >
        <i className="fas fa-cog"></i>
      </button>
    </div>
  </header>
);

const SettingsModal: React.FC<{
  settings: AiSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AiSettings) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  t: Record<string, string>;
}> = ({ settings, isOpen, onClose, onSave, onExport, onImport, t }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <i className="fas fa-sliders-h text-indigo-600"></i>
            {t.configuration}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.preferredLanguage}</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
              value={localSettings.language}
              onChange={(e) => setLocalSettings({...localSettings, language: e.target.value as SupportedLanguage})}
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.engineModel}</label>
            <div className="grid grid-cols-2 gap-3">
              {(['gemini-3-flash-preview', 'gemini-3-pro-preview'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setLocalSettings({...localSettings, model: m})}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    localSettings.model === m 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}
                >
                  {m.includes('flash') ? t.flashModel : t.proModel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.customPersona}</label>
            <textarea
              className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none h-20 placeholder:text-slate-300"
              placeholder={t.personaPlaceholder}
              value={localSettings.customInstructions}
              onChange={(e) => setLocalSettings({...localSettings, customInstructions: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <button
              onClick={onExport}
              className="py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs flex items-center justify-center gap-2"
            >
              <i className="fas fa-file-export"></i> {t.exportJson}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs flex items-center justify-center gap-2"
            >
              <i className="fas fa-file-import"></i> {t.importJson}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json"
              onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <button
            onClick={() => onSave(localSettings)}
            className="flex-grow py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
          >
            {t.saveSettings}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState<GoalDescription | null>(null);
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AiSettings>(() => {
    const saved = localStorage.getItem('goal_crafter_settings');
    return saved ? JSON.parse(saved) : {
      model: 'gemini-3-flash-preview',
      customInstructions: '',
      language: 'English'
    };
  });
  
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.English;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('goal_crafter_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [stepSolutions, setStepSolutions] = useState<Record<number, string>>({});
  const [loadingSteps, setLoadingSteps] = useState<Set<number>>(new Set());
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('goal_crafter_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('goal_crafter_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (workspaceRef.current) {
      const { scrollWidth, clientWidth } = workspaceRef.current;
      workspaceRef.current.scrollTo({ left: scrollWidth - clientWidth, behavior: 'smooth' });
    }
  }, [result, activeStepIndex, loadingSteps, isHistoryVisible]);

  const saveToHistory = (newResult: GoalDescription) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      goal,
      result: newResult,
      stepSolutions: {},
      settings: { ...settings },
      createdAt: Date.now()
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    const cacheKey = getCacheKey(goal, settings);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      setResult(parsed);
      setStatus(AppState.SUCCESS);
      saveToHistory(parsed);
      return;
    }

    setStatus(AppState.LOADING);
    setError(null);
    setStepSolutions({});
    setLoadingSteps(new Set());
    setActiveStepIndex(null);

    try {
      const data = await generateGoalDescription(goal, settings);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      setResult(data);
      setStatus(AppState.SUCCESS);
      saveToHistory(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setStatus(AppState.ERROR);
    }
  };

  const handleSelectStep = async (index: number) => {
    setActiveStepIndex(index);
    const step = result?.steps[index];
    if (!step) return;

    if (!stepSolutions[index] && !loadingSteps.has(index)) {
      setLoadingSteps(prev => new Set(prev).add(index));
      try {
        const solution = await generateStepSolution(result?.shortDescription || goal, `${step.title}: ${step.description}`, settings);
        setStepSolutions(prev => ({ ...prev, [index]: solution }));
        
        setHistory(prev => prev.map(item => {
          if (item.goal === goal && item.result.shortDescription === result?.shortDescription) {
            return { ...item, stepSolutions: { ...item.stepSolutions, [index]: solution } };
          }
          return item;
        }));
      } catch (err) {
        console.error("Failed to fetch solution:", err);
      } finally {
        setLoadingSteps(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setGoal(item.goal);
    setResult(item.result);
    setStepSolutions(item.stepSolutions);
    setSettings(item.settings);
    setStatus(AppState.SUCCESS);
    setActiveStepIndex(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `goal_crafter_history_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setHistory(prev => [...imported, ...prev]);
          alert(t.importSuccess);
        }
      } catch (err) {
        alert(t.importError);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setGoal('');
    setResult(null);
    setStatus(AppState.IDLE);
    setError(null);
    setStepSolutions({});
    setLoadingSteps(new Set());
    setActiveStepIndex(null);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onToggleHistory={() => setIsHistoryVisible(!isHistoryVisible)}
        isHistoryVisible={isHistoryVisible}
        t={t}
      />

      <SettingsModal 
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          setIsSettingsOpen(false);
        }}
        onExport={handleExport}
        onImport={handleImport}
        t={t}
      />

      <main 
        ref={workspaceRef}
        className="flex-grow flex flex-row overflow-x-auto overflow-y-hidden p-6 gap-6 scroll-smooth no-scrollbar"
      >
        {isHistoryVisible && (
          <section className="flex-shrink-0 w-72 flex flex-col gap-4 animate-in slide-in-from-left-4 duration-300">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest px-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="fas fa-archive text-indigo-500"></i> {t.pastGoals}
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{history.length}</span>
            </h2>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-300 text-xs italic">{t.noHistory}</div>
              ) : (
                history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-800 truncate mb-1 group-hover:text-indigo-600">{item.goal}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{item.settings.language}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        )}

        <section className="flex-shrink-0 w-80 lg:w-96 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full max-h-[600px]">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-bullseye text-indigo-500"></i>
              {t.objective}
            </h2>
            <form onSubmit={handleGenerate} className="flex-grow flex flex-col gap-4">
              <textarea
                className="flex-grow w-full p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none font-medium text-slate-700 bg-slate-50/50"
                placeholder={t.inputPlaceholder}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={status === AppState.LOADING}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!goal.trim() || status === AppState.LOADING}
                  className="flex-grow py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  {status === AppState.LOADING ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-magic"></i>}
                  {status === AppState.LOADING ? t.processing : t.generateRoadmap}
                </button>
                {status !== AppState.IDLE && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                  >
                    <i className="fas fa-redo"></i>
                  </button>
                )}
              </div>
            </form>
            {error && <p className="mt-4 text-xs text-red-500 font-medium">{error}</p>}
          </div>
        </section>

        {result && (
          <section className="flex-shrink-0 w-80 lg:w-96 flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-2 flex items-center gap-2">
              <i className="fas fa-list-ol text-indigo-500"></i>
              {t.actionSteps}
            </h2>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-10">
              {result.steps.map((step, index) => {
                const isActive = activeStepIndex === index;
                const isLoaded = !!stepSolutions[index];
                const isLoading = loadingSteps.has(index);

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectStep(index)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all transform active:scale-[0.98] group relative ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100 text-white' 
                        : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm text-slate-700'
                    }`}
                  >
                    <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-bold text-base leading-tight pr-4">{step.title}</h3>
                      {isLoaded && !isActive && <i className="fas fa-check-circle text-emerald-500 text-xs"></i>}
                      {isLoading && <i className="fas fa-circle-notch fa-spin text-indigo-400 text-xs"></i>}
                    </div>
                    <p className={`text-xs leading-relaxed ${isActive ? 'text-indigo-50' : 'text-slate-500'}`}>
                      {step.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {activeStepIndex !== null && (
          <section className="flex-shrink-0 w-[400px] lg:w-[500px] flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-2 flex items-center gap-2">
              <i className="fas fa-book-open text-indigo-500"></i>
              {t.detailedGuide}
            </h2>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full max-h-[700px]">
              <div className="p-8 overflow-y-auto custom-scrollbar">
                {loadingSteps.has(activeStepIndex) ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-20">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="font-medium animate-pulse">{t.consultingAdvisor}</p>
                  </div>
                ) : stepSolutions[activeStepIndex] ? (
                  <div className="animate-in fade-in duration-700">
                    <div className="mb-6 flex justify-between items-start border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded uppercase tracking-widest">{t.activeStep}</span>
                        <h3 className="text-2xl font-black text-slate-900 mt-2 leading-tight">
                          {result?.steps[activeStepIndex].title}
                        </h3>
                      </div>
                    </div>
                    <div className="prose prose-slate prose-sm max-w-none">
                      <div className="text-slate-700 text-sm leading-loose whitespace-pre-wrap font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        {stepSolutions[activeStepIndex]}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 py-20">
                     <i className="fas fa-brain text-4xl"></i>
                     <p className="font-medium italic">{t.planningOutput}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="flex-shrink-0 w-20"></div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}
