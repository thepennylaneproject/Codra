import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getProjectById } from '../../domain/projects';
import { Project, TearSheetRevision, MoodboardImage } from '../../domain/types';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import { generateSpreadFromProfile, saveSpread } from '../../domain/spread';
import { FileText, LayoutTemplate, Plus, TrendingUp, ShieldAlert, Palette, CheckCircle, AlertTriangle, Download, Share2 } from 'lucide-react';
import { CodraSignature } from '../components/CodraSignature';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { analytics } from '../../lib/analytics';
import { useToast } from '../components/Toast';
import { validateProjectContext, getValidationSummary, type ProjectContextFormState } from '../../lib/validation/projectBrief';
import { NextStepCTA } from '../../components/codra/NextStepCTA';
import '../../styles/form-validation.css';

export function ProjectContextPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [project, setProject] = useState<Project | null>(null);
    const [revisions, setRevisions] = useState<TearSheetRevision[]>([]);
    const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

    // Mode State
    const [isDraft, setIsDraft] = useState(false);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [tempData, setTempData] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isFormValid, setIsFormValid] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    // active revision data helper
    const activeRevision = revisions.find(r => r.id === selectedRevisionId);
    const contextData = activeRevision?.data;

    // Initial Load
    useEffect(() => {
        if (!projectId) return;

        getProjectById(projectId).then(p => {
            setProject(p);
        });

        const savedRevisions = localStorage.getItem(`codra:tearSheet:${projectId}`);
        if (savedRevisions) {
            try {
                const parsed: TearSheetRevision[] = JSON.parse(savedRevisions);
                setRevisions(parsed);

                // Determine if we are in draft mode (onboarding just finished)
                const latest = parsed[parsed.length - 1];
                const isDraftMode = searchParams.get('mode') === 'draft' || (latest && latest.status === 'draft');

                if (parsed.length > 0) {
                    setSelectedRevisionId(latest.id);
                }
                setIsDraft(!!isDraftMode);

            } catch (e) {
                console.error(e);
            }
        }
    }, [projectId, searchParams]);

    // Editing Handlers
    const handleStartEdit = (section: string, initialData: any) => {
        setEditingSection(section);
        setTempData(JSON.parse(JSON.stringify(initialData))); // Deep clone
    };

    const handleCancelEdit = () => {
        setEditingSection(null);
        setTempData(null);
    };

    const handleSaveSection = async (section: string) => {
        if (!projectId || !project || !tempData) return;

        // 1. Prepare updates
        const updates: any = {};
        if (section === 'identity') updates.identity = tempData;
        if (section === 'deliverables') updates.deliverables = tempData;
        if (section === 'audience') updates.audience = tempData;
        if (section === 'brand') updates.brand = tempData;
        if (section === 'success') updates.success = tempData;
        if (section === 'guardrails') updates.guardrails = tempData;

        // 2. Find or create draft revision
        let currentRevisions = [...revisions];
        let targetRevision = currentRevisions.find(r => r.id === selectedRevisionId);

        if (!targetRevision || targetRevision.status !== 'draft') {
            // Create new draft revision
            const newRev: TearSheetRevision = {
                id: crypto.randomUUID(),
                version: (targetRevision?.version || 0) + 1,
                createdAt: new Date().toISOString(),
                summary: `Edits to ${section}`,
                status: 'draft',
                createdFrom: 'manual',
                scopeImpact: 'Low',
                data: {
                    ...(targetRevision?.data || {}),
                    ...updates
                }
            };
            currentRevisions.push(newRev);
            setSelectedRevisionId(newRev.id);
            setIsDraft(true);
        } else {
            // Update existing draft
            targetRevision.data = {
                ...targetRevision.data,
                ...updates
            };
        }

        setRevisions(currentRevisions);
        localStorage.setItem(`codra:tearSheet:${projectId}`, JSON.stringify(currentRevisions));
        setEditingSection(null);
        setTempData(null);
    };

    // Handlers
    const handleExportPDF = async () => {
        if (!exportRef.current || !project) return;
        
        setIsExporting(true);
        analytics.track('tearsheet_export_pdf', { projectId });
        
        try {
            const canvas = await html2canvas(exportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`Codra_ProjectBrief_${project.name.replace(/\s+/g, '_')}.pdf`);

            toast.success('Project Brief exported successfully.');
        } catch (err) {
            console.error('PDF Export failed:', err);
            toast.error('Failed to export PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleShareLink = () => {
        navigator.clipboard.writeText(window.location.href);
        analytics.track('tearsheet_share_link', { projectId });
        toast.success('Link copied to clipboard.');
    };

    const handleApproveAndLaunch = () => {
        if (!projectId || !project || !activeRevision) return;

        // Validate required fields before proceeding
        const formData: ProjectContextFormState = {
            audience: displayData.audience,
            brand: displayData.brand,
            success: displayData.success,
            guardrails: displayData.guardrails
        };

        const validation = validateProjectContext(formData);
        
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            const summary = getValidationSummary(validation.errors);
            toast.error(summary);
            analytics.track('project_context_validation_failed', { 
                projectId, 
                errors: Object.keys(validation.errors) 
            });
            return;
        }

        // Clear any previous validation errors
        setValidationErrors({});

        // 1. Mark revision as approved
        const updatedRevisions = revisions.map(r =>
            r.id === selectedRevisionId ? { ...r, status: 'approved' as const } : r
        );
        setRevisions(updatedRevisions);
        localStorage.setItem(`codra:tearSheet:${projectId}`, JSON.stringify(updatedRevisions));

        // 2. Load extended profile
        const profileStr = localStorage.getItem(`codra:onboardingProfile:${projectId}`);
        let extendedProfile: ExtendedOnboardingProfile | null = null;
        try {
            extendedProfile = profileStr ? JSON.parse(profileStr) : null;
        } catch { /* ignore */ }

        // 3. Generate and Save Spread
        const moodboard = activeRevision.data?.moodboard || [];
        const spread = generateSpreadFromProfile(
            project,
            extendedProfile,
            moodboard,
            activeRevision.data as any
        );
        saveSpread(spread);

        // 4. Default Layout
        const defaultLayout = {
            docks: {
                left: { width: 320, visible: true, activeTab: 'toc' },
                right: { width: 320, visible: true, activeTab: 'context' }
            }
        };
        localStorage.setItem(`codra:spread:${projectId}:layout`, JSON.stringify(defaultLayout));

        navigate(`/p/${projectId}/spread`);
    };

    // Validate form whenever project data changes to track if CTA should show
    useEffect(() => {
        if (!project) return;

        // Compute localized version of displayData for validation
        const currentContext = (isDraft || activeRevision?.status === 'draft') ? {
            audience: contextData?.audience || { primary: project.audience || '', context: project.audienceContext },
            brand: contextData?.brand || project.brandConstraints || {},
            success: contextData?.success || project.successCriteria || {},
            guardrails: contextData?.guardrails || project.guardrails || {},
        } : {
            audience: { primary: project.audience || '', context: project.audienceContext },
            brand: project.brandConstraints || {},
            success: project.successCriteria || {},
            guardrails: project.guardrails || {},
        };

        const formData: ProjectContextFormState = {
            audience: currentContext.audience,
            brand: currentContext.brand,
            success: currentContext.success,
            guardrails: currentContext.guardrails
        };
        const validation = validateProjectContext(formData);
        setIsFormValid(validation.isValid);
    }, [project, contextData, isDraft, activeRevision]);

    // Handle workspace selection from NextStepCTA
    const handleSelectWorkspace = (workspaceId: string) => {
        if (!projectId) return;
        navigate(`/p/${projectId}/desk/${workspaceId}`);
    };


    if (!project) return <div className="h-screen flex items-center justify-center font-serif text-zinc-400">Loading Context...</div>;

    // Use contextData if in draft/review, otherwise use base project
    const displayData = (isDraft || activeRevision?.status === 'draft') ? {
        identity: {
            name: contextData?.identity?.name || project.name,
            summary: contextData?.identity?.summary || project.summary || '',
            type: contextData?.identity?.type || project.type
        },
        deliverables: contextData?.deliverables || project.deliverables || [],
        audience: contextData?.audience || { primary: project.audience || '', context: project.audienceContext },
        brand: contextData?.brand || project.brandConstraints || {},
        success: contextData?.success || project.successCriteria || {},
        guardrails: contextData?.guardrails || project.guardrails || {},
        moodboard: contextData?.moodboard || [],
    } : {
        identity: { name: project.name, summary: project.summary || '', type: project.type },
        deliverables: project.deliverables || [],
        audience: { primary: project.audience || '', context: project.audienceContext },
        brand: project.brandConstraints || {},
        success: project.successCriteria || {},
        guardrails: project.guardrails || {},
        moodboard: project.moodboard || [], // Fallback to project moodboard if context doesn't have it
    };

    return (
        <div className={`min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-rose-200 ${isDraft ? 'pb-32' : ''}`}>
            {/* Nav Header */}
            <header className="h-12 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isDraft ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="font-bold tracking-tight text-sm">CODRA</span>
                        <span className="text-zinc-400">/</span>
                        <span className="font-medium text-sm text-zinc-600 truncate max-w-[200px]">{displayData.identity.name}</span>
                    </div>
                </div>

                <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-100 p-1 rounded-full border border-zinc-200 shadow-sm">
                    <Link to={`/p/${projectId}/spread`} className="px-4 py-1.5 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-white transition-all flex items-center gap-2">
                        <LayoutTemplate size={12} />
                        Spread
                    </Link>
                    <button className="px-4 py-1.5 rounded-full bg-white text-xs font-medium text-zinc-900 shadow-sm flex items-center gap-2 ring-1 ring-zinc-200">
                        <FileText size={12} className="text-rose-500" />
                        Context
                    </button>
                </nav>

                <div className="flex items-center gap-3">
                    {!isDraft && (
                        <button
                            onClick={() => console.log('Create revision')}
                            className="p-1.5 rounded-full bg-zinc-900 text-white hover:bg-rose-500 transition-colors"
                            title="Create Revision"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 bg-zinc-100 rounded-full p-0.5 border border-zinc-200">
                        <select
                            value={selectedRevisionId || ''}
                            onChange={(e) => setSelectedRevisionId(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-bold uppercase tracking-wider text-zinc-500 focus:ring-0 pl-3 pr-8 py-1"
                        >
                            {revisions.map(rev => (
                                <option key={rev.id} value={rev.id}>v{rev.version} {rev.status === 'draft' ? '(Draft)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-4 w-[1px] bg-zinc-200 mx-1" />

                    <button
                        onClick={handleShareLink}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 transition-colors"
                        title="Copy Share Link"
                    >
                        <Share2 size={14} />
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50"
                        title="Export to PDF"
                    >
                        <Download size={14} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto py-16 px-8" ref={exportRef}>
                {/* Identity Header */}
                <div className="mb-16 border-b border-zinc-200 pb-12 relative group">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-rose-500 uppercase">Project Context</span>
                        <span className="text-zinc-300">/</span>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">{displayData.identity.type || 'General'}</span>
                    </div>

                    {editingSection === 'identity' ? (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={tempData.name}
                                    onChange={(e) => setTempData({ ...tempData, name: e.target.value })}
                                    className="w-full text-4xl font-serif font-medium bg-transparent border-b border-zinc-200 focus:border-zinc-900 outline-none pb-2 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">One-Line Summary</label>
                                <textarea
                                    value={tempData.summary}
                                    onChange={(e) => setTempData({ ...tempData, summary: e.target.value })}
                                    className="w-full text-xl text-zinc-500 font-light bg-transparent border-b border-zinc-200 focus:border-zinc-900 outline-none pb-2 transition-colors min-h-[80px] resize-none"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleSaveSection('identity')}
                                    className="px-6 py-2 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-rose-500 transition-colors"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-6 py-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start justify-between">
                                <h1 className="text-5xl font-serif font-medium text-zinc-900 mb-6 tracking-tight flex-1">
                                    {displayData.identity.name}
                                </h1>
                                <button
                                    onClick={() => handleStartEdit('identity', displayData.identity)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-zinc-900 transition-all"
                                    title="Edit Identity"
                                >
                                    <Plus className="rotate-45" size={18} />
                                </button>
                            </div>
                            <p className="text-xl text-zinc-500 font-light max-w-2xl leading-relaxed">
                                {displayData.identity.summary}
                            </p>
                        </>
                    )}
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Deliverables Section */}
                    <ContextSection
                        title="Deliverables"
                        icon={<CheckCircle size={16} />}
                        className="md:col-span-2"
                        isEditing={editingSection === 'deliverables'}
                        onEdit={() => handleStartEdit('deliverables', displayData.deliverables)}
                        onSave={() => handleSaveSection('deliverables')}
                        onCancel={handleCancelEdit}
                        renderEdit={() => (
                            <div className="space-y-4">
                                {(tempData as any[]).map((d, i) => (
                                    <div key={i} className="flex gap-4 items-start bg-white p-3 border border-zinc-100 rounded-sm">
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={d.name}
                                                onChange={(e) => {
                                                    const next = [...(tempData as any[])];
                                                    next[i] = { ...next[i], name: e.target.value };
                                                    setTempData(next);
                                                }}
                                                placeholder="Deliverable Name"
                                                className="text-sm font-medium border-b border-zinc-200 focus:border-zinc-900 outline-none pb-1"
                                            />
                                            <select
                                                value={d.type}
                                                onChange={(e) => {
                                                    const next = [...(tempData as any[])];
                                                    next[i] = { ...next[i], type: e.target.value };
                                                    setTempData(next);
                                                }}
                                                className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-none bg-transparent focus:ring-0"
                                            >
                                                <option value="website">website</option>
                                                <option value="app">app</option>
                                                <option value="campaign">campaign</option>
                                                <option value="copy">copy</option>
                                                <option value="design">design</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const next = (tempData as any[]).filter((_, idx) => idx !== i);
                                                setTempData(next);
                                            }}
                                            className="text-zinc-300 hover:text-rose-500 p-1"
                                        >
                                            <Plus className="rotate-45" size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setTempData([...(tempData as any[]), { id: `deliv-${Date.now()}`, name: '', type: 'design', status: 'planned' }])}
                                    className="w-full py-3 border border-dashed border-zinc-200 text-xs text-zinc-400 hover:text-zinc-900 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Add Deliverable
                                </button>
                            </div>
                        )}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayData.deliverables.map((d, i) => (
                                <div key={d.id || i} className="p-4 bg-white border border-zinc-200 rounded-sm group hover:border-zinc-900 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{d.type}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 group-hover:bg-rose-500 transition-colors" />
                                    </div>
                                    <h4 className="text-sm font-medium text-zinc-900 mb-1">{d.name}</h4>
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">{d.status}</p>
                                </div>
                            ))}
                            {isDraft && (
                                <button
                                    onClick={() => handleStartEdit('deliverables', displayData.deliverables)}
                                    className="p-4 border border-dashed border-zinc-300 rounded-sm flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all"
                                >
                                    <Plus size={14} /> Add Deliverable
                                </button>
                            )}
                        </div>
                    </ContextSection>

                    {/* Audience Section */}
                    <ContextSection
                        title="Target Audience"
                        icon={<TrendingUp size={16} />}
                        isEditing={editingSection === 'audience'}
                        onEdit={() => handleStartEdit('audience', displayData.audience)}
                        onSave={() => handleSaveSection('audience')}
                        onCancel={handleCancelEdit}
                        isRequired={true}
                        error={validationErrors.audience}
                        renderEdit={() => (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Primary Segment<span className="required-indicator">*</span></label>
                                    <input
                                        type="text"
                                        value={tempData.primary}
                                        onChange={(e) => setTempData({ ...tempData, primary: e.target.value })}
                                        className="w-full text-base font-medium bg-transparent border-b border-zinc-200 focus:border-zinc-900 outline-none pb-1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Context</label>
                                        <select
                                            value={tempData.context?.segment}
                                            onChange={(e) => setTempData({ ...tempData, context: { ...tempData.context, segment: e.target.value } })}
                                            className="w-full text-sm border-none bg-zinc-100 rounded-sm px-2 py-1.5 focus:ring-0"
                                        >
                                            <option value="B2B">B2B</option>
                                            <option value="B2C">B2C</option>
                                            <option value="Mixed">Mixed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Sophistication</label>
                                        <select
                                            value={tempData.context?.sophistication}
                                            onChange={(e) => setTempData({ ...tempData, context: { ...tempData.context, sophistication: e.target.value } })}
                                            className="w-full text-sm border-none bg-zinc-100 rounded-sm px-2 py-1.5 focus:ring-0"
                                        >
                                            <option value="novice">Novice</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    >
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Primary Segment</h4>
                                <p className="text-base text-zinc-700 font-medium">{displayData.audience.primary}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Context</h4>
                                    <p className="text-sm text-zinc-600">{displayData.audience.context?.segment || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Sophistication</h4>
                                    <p className="text-sm text-zinc-600 capitalize">{displayData.audience.context?.sophistication || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </ContextSection>

                    {/* Brand Section */}
                    <ContextSection
                        title="Brand Constraints"
                        icon={<Palette size={16} />}
                        isEditing={editingSection === 'brand'}
                        onEdit={() => handleStartEdit('brand', displayData.brand)}
                        onSave={() => handleSaveSection('brand')}
                        onCancel={handleCancelEdit}
                        isRequired={true}
                        error={validationErrors.brand}
                        renderEdit={() => (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Brand Voice & Guidelines<span className="required-indicator">*</span></label>
                                    <textarea
                                        value={tempData.voiceGuidelines}
                                        onChange={(e) => setTempData({ ...tempData, voiceGuidelines: e.target.value })}
                                        className="w-full text-sm text-zinc-700 font-serif bg-transparent border-b border-zinc-200 focus:border-zinc-900 outline-none pb-1 min-h-[100px] resize-none italic"
                                        placeholder="e.g. Professional yet approachable, editorial and dry..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Color Palette (Hex)</label>
                                    <div className="flex gap-4">
                                        {['primary', 'secondary', 'accent'].map(key => (
                                            <div key={key} className="flex-1 space-y-1">
                                                <input
                                                    type="text"
                                                    value={tempData.colors?.[key]}
                                                    onChange={(e) => setTempData({
                                                        ...tempData,
                                                        colors: { ...(tempData.colors || {}), [key]: e.target.value }
                                                    })}
                                                    placeholder={key}
                                                    className="w-full text-[10px] font-mono border-b border-zinc-200 focus:border-zinc-900 outline-none"
                                                />
                                                <div className="w-full h-4 rounded-sm border border-zinc-100" style={{ background: tempData.colors?.[key] }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    >
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Voice & Tone</h4>
                                <p className="text-sm text-zinc-700 leading-relaxed italic">
                                    &ldquo;{displayData.brand.voiceGuidelines || 'N/A'}&rdquo;
                                </p>
                            </div>
                            {displayData.brand.colors && (
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Color Palette</h4>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full border border-zinc-200" style={{ background: displayData.brand.colors.primary }} title="Primary" />
                                        <div className="w-8 h-8 rounded-full border border-zinc-200" style={{ background: displayData.brand.colors.secondary }} title="Secondary" />
                                        <div className="w-8 h-8 rounded-full border border-zinc-200" style={{ background: displayData.brand.colors.accent }} title="Accent" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ContextSection>

                    {/* Success Section */}
                    <ContextSection
                        title="Success Criteria"
                        icon={<CheckCircle size={16} />}
                        isEditing={editingSection === 'success'}
                        onEdit={() => handleStartEdit('success', displayData.success)}
                        onSave={() => handleSaveSection('success')}
                        onCancel={handleCancelEdit}
                        isRequired={true}
                        error={validationErrors.success}
                        renderEdit={() => (
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">Definition of Done<span className="required-indicator">*</span></label>
                                {(tempData.definitionOfDone || []).map((step: string, i: number) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={step}
                                            onChange={(e) => {
                                                const next = [...(tempData.definitionOfDone || [])];
                                                next[i] = e.target.value;
                                                setTempData({ ...tempData, definitionOfDone: next });
                                            }}
                                            className="flex-1 text-sm border-b border-zinc-200 focus:border-zinc-900 outline-none pb-1"
                                        />
                                        <button
                                            onClick={() => {
                                                const next = (tempData.definitionOfDone || []).filter((_: any, idx: number) => idx !== i);
                                                setTempData({ ...tempData, definitionOfDone: next });
                                            }}
                                            className="text-zinc-300 hover:text-rose-500"
                                        >
                                            <Plus className="rotate-45" size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setTempData({ ...tempData, definitionOfDone: [...(tempData.definitionOfDone || []), ''] })}
                                    className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest hover:text-zinc-900 flex items-center gap-2"
                                >
                                    <Plus size={12} /> Add Criteria
                                </button>
                            </div>
                        )}
                    >
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Definition of Done</h4>
                                <ul className="space-y-2">
                                    {displayData.success.definitionOfDone?.map((step: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm text-zinc-600">
                                            <span className="text-zinc-300 font-mono text-[10px] mt-1">0{i + 1}</span>
                                            {step}
                                        </li>
                                    )) || <li className="text-sm text-zinc-400 italic">None defined</li>}
                                </ul>
                            </div>
                        </div>
                    </ContextSection>

                    {/* Guardrails Section */}
                    <ContextSection
                        title="Guardrails"
                        icon={<ShieldAlert size={16} />}
                        isEditing={editingSection === 'guardrails'}
                        onEdit={() => handleStartEdit('guardrails', displayData.guardrails)}
                        onSave={() => handleSaveSection('guardrails')}
                        onCancel={handleCancelEdit}
                        isRequired={true}
                        error={validationErrors.guardrails}
                        renderEdit={() => (
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-rose-200 block mb-3 pb-1">Must Avoid<span className="required-indicator">*</span></label>
                                    <div className="space-y-3">
                                        {(tempData.mustAvoid || []).map((item: string, i: number) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => {
                                                        const next = [...(tempData.mustAvoid || [])];
                                                        next[i] = e.target.value;
                                                        setTempData({ ...tempData, mustAvoid: next });
                                                    }}
                                                    className="flex-1 text-sm border-b border-rose-100 focus:border-rose-500 outline-none pb-1"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const next = (tempData.mustAvoid || []).filter((_: any, idx: number) => idx !== i);
                                                        setTempData({ ...tempData, mustAvoid: next });
                                                    }}
                                                    className="text-zinc-300 hover:text-rose-500"
                                                >
                                                    <Plus className="rotate-45" size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setTempData({ ...tempData, mustAvoid: [...(tempData.mustAvoid || []), ''] })}
                                            className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest hover:text-rose-500 flex items-center gap-2"
                                        >
                                            <Plus size={12} /> Add Prohibition
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 block mb-3">Competitors To Watch</label>
                                    <div className="space-y-3">
                                        {(tempData.competitors || []).map((c: string, i: number) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={c}
                                                    onChange={(e) => {
                                                        const next = [...(tempData.competitors || [])];
                                                        next[i] = e.target.value;
                                                        setTempData({ ...tempData, competitors: next });
                                                    }}
                                                    className="flex-1 text-sm border-b border-emerald-100 focus:border-emerald-500 outline-none pb-1"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const next = (tempData.competitors || []).filter((_: any, idx: number) => idx !== i);
                                                        setTempData({ ...tempData, competitors: next });
                                                    }}
                                                    className="text-zinc-300 hover:text-rose-500"
                                                >
                                                    <Plus className="rotate-45" size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setTempData({ ...tempData, competitors: [...(tempData.competitors || []), ''] })}
                                            className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest hover:text-emerald-500 flex items-center gap-2"
                                        >
                                            <Plus size={12} /> Add Competitor
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    >
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-rose-200 mb-3 pb-1">Must Avoid</h4>
                                <ul className="space-y-2">
                                    {displayData.guardrails.mustAvoid?.map((item: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm text-zinc-600">
                                            <div className="w-1 h-1 rounded-full bg-rose-300 mt-2" />
                                            {item}
                                        </li>
                                    )) || <li className="text-sm text-zinc-400 italic">None defined</li>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Competitors To Watch</h4>
                                <div className="flex flex-wrap gap-2">
                                    {displayData.guardrails.competitors?.map((c: string, i: number) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-zinc-100 text-zinc-600 rounded-sm">
                                            {c}
                                        </span>
                                    )) || <span className="text-xs text-zinc-400 italic">None listed</span>}
                                </div>
                            </div>
                        </div>
                    </ContextSection>
                </div>

                {/* Next Step CTA - show when form is valid */}
                {isFormValid && (
                    <NextStepCTA onSelectWorkspace={handleSelectWorkspace} />
                )}

                {/* Moodboard Visualization */}
                {displayData.moodboard.length > 0 && (
                    <div className="mt-24 pt-12 border-t border-zinc-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-900 uppercase flex items-center gap-2">
                                <Palette size={14} className="text-rose-500" />
                                Working References
                            </h3>
                            <span className="text-[10px] text-zinc-400">v1 Moodboard snapshot</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-[400px]">
                            {displayData.moodboard.slice(0, 4).map((img: MoodboardImage, i: number) => (
                                <div key={img.id || i} className="relative group overflow-hidden bg-zinc-100 rounded-sm h-full">
                                    <img src={img.imageUrl} alt={img.role} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" />
                                    <div className="absolute inset-0 bg-zinc-900/10 group-hover:bg-transparent transition-colors" />
                                    <div className="absolute bottom-4 left-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white drop-shadow-md">{img.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Signature Footer */}
                <footer className="mt-32 pt-16 border-t border-zinc-200 pb-8 text-center">
                    <CodraSignature context="DEFAULT" />
                </footer>
            </main>

            {/* Confirmation Gate Footer */}
            {isDraft && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
                    <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900">Review Draft Context</h4>
                                <p className="text-xs text-zinc-500">This will be the source of truth for Lyra’s guidance.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/new')}
                                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                                Back to intake
                            </button>
                            <button
                                onClick={handleApproveAndLaunch}
                                className="px-8 py-2.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-rose-500 transition-all rounded-sm shadow-xl"
                            >
                                Confirm and Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponent for sections
function ContextSection({
    title,
    icon,
    children,
    className,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    renderEdit,
    isRequired,
    error
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    isEditing?: boolean;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    renderEdit?: () => React.ReactNode;
    isRequired?: boolean;
    error?: string;
}) {
    return (
        <section className={cn("space-y-6 relative group", error && "section-error", className)}>
            <div className={cn("flex items-center justify-between border-b pb-3", error ? "border-rose-200" : "border-zinc-200")}>
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-900 uppercase flex items-center gap-2">
                    <span className={error ? "text-rose-500" : "text-rose-500"}>{icon}</span>
                    {title}
                    {isRequired && <span className="required-indicator">*</span>}
                </h3>
                {!isEditing && onEdit && (
                    <button
                        onClick={onEdit}
                        className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-zinc-900 transition-all"
                    >
                        <Plus className="rotate-45" size={14} />
                    </button>
                )}
            </div>

            {isEditing && renderEdit ? (
                <div className="space-y-6">
                    {renderEdit()}
                    <div className="flex gap-4 pt-4 border-t border-zinc-100">
                        <button
                            onClick={onSave}
                            className="bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-sm hover:bg-rose-500 transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={onCancel}
                            className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors px-4 py-1.5"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {children}
                    {error && (
                        <div className="error-message">
                            <AlertTriangle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
