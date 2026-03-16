import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Cpu, Upload, Zap, DollarSign, Clock, AlertTriangle, Link2, CheckCircle, Sparkles, ArrowLeft, Wallet, Copy, ExternalLink, Video } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categories = ['Marketing', 'Web Development', 'Design', 'Data', 'Research', 'Operations'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];

const MIN_HOURLY_RATE = 20;
const COMMISSION_RATE = 0.10;

interface Mission {
  title: string;
  description: string;
  skill: string;
  hours: number;
  hourlyRate: number;
  reward: number;
}

const ProjectCreate = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [quoteAccepted, setQuoteAccepted] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [budget, setBudget] = useState('');
  const [editingBudget, setEditingBudget] = useState('');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState(priorities[1]);
  const [resourceLink, setResourceLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const hasPdfFile = files.some(f => f.name.toLowerCase().endsWith('.pdf'));

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate resource link is provided
    if (!resourceLink.trim()) {
      toast.error(
        'Se requiere un link de recursos del proyecto (Google Drive, Dropbox, etc.) con briefs, logos, paleta de colores y materiales necesarios para que los exploradores ejecuten el trabajo correctamente.',
        { duration: 8000 }
      );
      return;
    }

    // Validate at least one PDF file is uploaded
    if (!hasPdfFile) {
      toast.error(
        'Se requiere un documento PDF con el detalle exacto del resultado esperado de la ejecución del proyecto. Por favor sube un PDF con las especificaciones, entregables y criterios de aceptación.',
        { duration: 8000 }
      );
      return;
    }

    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-project', {
        body: {
          title: projectTitle,
          description: projectDescription,
          category,
          priority,
          budget: parseFloat(budget) || 0,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMissions(data.missions || []);
      setQuoteAccepted(false);
      setAnalyzed(true);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      toast.error(err.message || 'Failed to analyze project. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimizeBudget = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-missions', {
        body: {
          missions,
          budget: budgetNum,
          projectTitle,
          projectDescription,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const keptIndices: number[] = data.kept_indices || [];
      const optimizedMissions = missions.filter((_, i) => keptIndices.includes(i));

      if (optimizedMissions.length === 0) {
        toast.error('No se pudieron seleccionar misiones dentro del presupuesto.');
        return;
      }

      setMissions(optimizedMissions);
      toast.success(
        `IA seleccionó ${optimizedMissions.length} misiones prioritarias que caben en tu presupuesto. ${data.reasoning || ''}`
      );
    } catch (err: any) {
      console.error('Optimization failed:', err);
      toast.error(err.message || 'Error al optimizar misiones.');
    } finally {
      setOptimizing(false);
    }
  };

  const deleteMission = (index: number) => {
    setMissions(prev => prev.filter((_, i) => i !== index));
  };

  const handleBackToEdit = () => {
    setAnalyzed(false);
    setQuoteAccepted(false);
    setEditingBudget(budget);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      let screenshotUrl: string | null = null;

      // Upload payment screenshot if provided
      if (paymentScreenshot) {
        const ext = paymentScreenshot.name.split('.').pop() || 'png';
        const filePath = `${user?.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(filePath, paymentScreenshot);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);
        screenshotUrl = urlData.publicUrl;
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: projectTitle,
          description: projectDescription,
          category,
          priority,
          budget: budgetNum,
          payment_status: 'paid',
          user_id: user?.id,
          resource_link: resourceLink || null,
          video_link: videoLink || null,
          deadline: deadline || null,
          payment_screenshot_url: screenshotUrl,
          tx_hash: txHash || null,
        } as any)
        .select()
        .single();

      if (projectError) throw projectError;

      const missionsToInsert = missions.map(m => ({
        project_id: project.id,
        title: m.title,
        description: m.description,
        skill: m.skill,
        hours: m.hours,
        hourly_rate: m.hourlyRate,
        reward: m.reward,
      }));

      const { error: missionsError } = await supabase
        .from('missions')
        .insert(missionsToInsert);

      if (missionsError) throw missionsError;

      toast.success(`${missions.length} misiones publicadas exitosamente!`);
      navigate('/marketplace');
    } catch (err: any) {
      console.error('Publish failed:', err);
      toast.error(err.message || 'Failed to publish missions.');
    } finally {
      setPublishing(false);
    }
  };

  const totalTalentCost = missions.reduce((sum, m) => sum + m.reward, 0);
  const gophoraCommission = Math.round(totalTalentCost * COMMISSION_RATE);
  const totalCost = totalTalentCost + gophoraCommission;
  const totalHours = missions.reduce((sum, m) => sum + m.hours, 0);
  const budgetNum = parseFloat(budget) || 0;
  const overBudget = totalCost > budgetNum;

  return (
    <div
      className="min-h-screen bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) navigate(-1);
      }}
    >
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">{t('project.create_title')}</h1>
        </div>

      {!analyzed ? (
        <form onSubmit={handleAnalyze} className="space-y-6 rounded-xl border border-border/50 bg-card p-6">
          <div>
            <Label className="font-heading text-xs tracking-wider uppercase">{t('project.title')}</Label>
            <Input className="mt-1.5" placeholder="E-commerce Website Redesign" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} required />
          </div>
          <div>
            <Label className="font-heading text-xs tracking-wider uppercase">{t('project.description')}</Label>
            <Textarea className="mt-1.5 min-h-[120px]" placeholder="Describe your project in detail..." value={projectDescription} onChange={e => setProjectDescription(e.target.value)} required />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('project.category')}</Label>
              <select className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 text-sm font-body" value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('project.priority')}</Label>
              <select className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 text-sm font-body" value={priority} onChange={e => setPriority(e.target.value)}>
                {priorities.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('project.deadline')}</Label>
              <Input type="date" className="mt-1.5" value={deadline} onChange={e => setDeadline(e.target.value)} required />
            </div>
            <div>
              <Label className="font-heading text-xs tracking-wider uppercase">{t('project.budget')}</Label>
              <Input
                type="number"
                className="mt-1.5"
                placeholder="5000"
                min={1}
                value={budget}
                onChange={e => setBudget(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground font-body mt-1">
                Min. rate: ${MIN_HOURLY_RATE}/hr • GOPHORA fee: {COMMISSION_RATE * 100}%
              </p>
            </div>
          </div>
          <div>
            <Label className="font-heading text-xs tracking-wider uppercase flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              {t('project.resource_link')} <span className="text-destructive">*</span>
            </Label>
            <Input
              className={cn("mt-1.5", !resourceLink.trim() && "border-destructive/50")}
              type="url"
              placeholder={t('project.resource_link_placeholder')}
              value={resourceLink}
              onChange={e => setResourceLink(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground font-body mt-1.5 leading-relaxed">
              {t('project.resource_link_help')}
            </p>
            {!resourceLink.trim() && (
              <p className="text-xs text-destructive font-body mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Obligatorio: Comparte un link con briefs, logos y materiales para los exploradores.
              </p>
            )}
          </div>
          <div>
            <Label className="font-heading text-xs tracking-wider uppercase flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video explicativo del proyecto
            </Label>
            <Input
              className="mt-1.5"
              type="url"
              placeholder="https://www.youtube.com/watch?v=... o https://www.loom.com/share/..."
              value={videoLink}
              onChange={e => setVideoLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground font-body mt-1.5 leading-relaxed">
              Opcional: Comparte un video (YouTube, Loom, Google Drive, etc.) explicando el resultado exacto que esperas de la ejecución de las misiones. Esto ayuda a los exploradores a comprender mejor los objetivos del proyecto.
            </p>
          </div>
          <div>
            <Label className="font-heading text-xs tracking-wider uppercase">
              {t('project.files')} <span className="text-destructive">* (PDF requerido)</span>
            </Label>
            <label
              className={cn(
                "mt-1.5 border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/30 transition-colors cursor-pointer block",
                !hasPdfFile ? "border-destructive/50" : "border-border"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip" />
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-body">Arrastra y suelta archivos o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Incluye un PDF con las especificaciones del resultado esperado</p>
            </label>
            {!hasPdfFile && (
              <p className="text-xs text-destructive font-body mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Obligatorio: Sube un documento PDF con el detalle exacto del resultado esperado.
              </p>
            )}
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2">
                    <span className="truncate font-body flex items-center gap-2">
                      {f.name.toLowerCase().endsWith('.pdf') && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {f.name}
                    </span>
                    <button type="button" onClick={() => removeFile(i)} className="text-destructive text-xs font-heading ml-2 shrink-0">Eliminar</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="submit" variant="hero" className="w-full gap-2" disabled={analyzing}>
            {analyzing ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" /> {t('project.analyze')}
              </>
            )}
          </Button>
        </form>
      ) : !quoteAccepted ? (
        /* ── QUOTE REVIEW PHASE ── */
        <div className="space-y-6">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="h-6 w-6 text-primary" />
              <h2 className="font-heading font-bold text-lg">AI Mission Architect</h2>
            </div>
            <p className="text-sm text-muted-foreground font-body mb-2">
              Tu proyecto <span className="font-semibold text-foreground">"{projectTitle}"</span> ha sido analizado y dividido en <span className="font-semibold text-primary">{missions.length}</span> micro-misiones ejecutables basadas en tu presupuesto de ${budgetNum.toLocaleString()}.
            </p>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-heading uppercase">Presupuesto</span>
              </div>
              <p className="text-xl font-heading font-bold">${budgetNum.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-heading uppercase">Horas Totales</span>
              </div>
              <p className="text-xl font-heading font-bold">{totalHours}h</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-heading uppercase">Costo Talento</span>
              </div>
              <p className="text-xl font-heading font-bold">${totalTalentCost.toLocaleString()}</p>
            </div>
            <div className={`rounded-xl border p-4 ${overBudget ? 'border-destructive/50 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
              <div className="flex items-center gap-2 mb-1">
                {overBudget ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <DollarSign className="h-4 w-4 text-primary" />}
                <span className="text-xs text-muted-foreground font-heading uppercase">Total + Fee ({COMMISSION_RATE * 100}%)</span>
              </div>
              <p className={`text-xl font-heading font-bold ${overBudget ? 'text-destructive' : 'text-primary'}`}>${totalCost.toLocaleString()}</p>
            </div>
          </div>

          {overBudget && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm font-body text-destructive">
                El costo total (${totalCost.toLocaleString()}) excede tu presupuesto (${budgetNum.toLocaleString()}). Puedes ajustar tu presupuesto, eliminar misiones manualmente, o dejar que la IA sugiera las misiones prioritarias.
              </p>
            </div>
          )}

          {/* Missions Table */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">#</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Misión</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Skill</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Horas</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Tarifa/hr</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Recompensa</th>
                    <th className="text-left p-4 font-heading text-xs tracking-wider uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((m, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="p-4 text-xs text-muted-foreground font-body">{i + 1}</td>
                      <td className="p-4 font-body text-sm">
                        <div>{m.title}</div>
                        {m.description && <div className="text-xs text-muted-foreground mt-1">{m.description}</div>}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-heading font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">{m.skill}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-body">{m.hours}h</td>
                      <td className="p-4 text-sm text-muted-foreground font-body">${m.hourlyRate}/hr</td>
                      <td className="p-4 text-sm font-heading font-semibold text-primary">${m.reward.toLocaleString()}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="text-xs font-heading text-destructive" onClick={() => deleteMission(i)}>Eliminar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/50 bg-muted/30">
                    <td className="p-4 font-heading font-bold text-sm" colSpan={3}>TOTAL ({missions.length} misiones)</td>
                    <td className="p-4 font-heading font-bold text-sm">{totalHours}h</td>
                    <td className="p-4 text-sm text-muted-foreground font-body">—</td>
                    <td className="p-4 font-heading font-bold text-sm text-primary">${totalTalentCost.toLocaleString()}</td>
                    <td className="p-4"></td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="px-4 pb-2 text-xs text-muted-foreground font-body" colSpan={5}>Comisión GOPHORA ({COMMISSION_RATE * 100}%)</td>
                    <td className="px-4 pb-2 text-xs text-muted-foreground font-heading">${gophoraCommission.toLocaleString()}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="px-4 pb-4 text-sm font-heading font-bold" colSpan={5}>GRAN TOTAL</td>
                    <td className={`px-4 pb-4 text-sm font-heading font-bold ${overBudget ? 'text-destructive' : 'text-primary'}`}>${totalCost.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {overBudget && (
              <Button
                variant="hero-outline"
                className="w-full gap-2 font-heading"
                disabled={optimizing}
                onClick={handleOptimizeBudget}
              >
                {optimizing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Optimizando con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> {t('project.optimize_budget')}
                  </>
                )}
              </Button>
            )}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleBackToEdit}
                className="font-heading gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> {t('project.edit_budget')}
              </Button>
              <Button
                variant="hero"
                className="flex-1 font-heading gap-2"
                disabled={overBudget || missions.length === 0}
                onClick={() => setQuoteAccepted(true)}
              >
                <CheckCircle className="h-4 w-4" /> {t('project.accept_quote')}
              </Button>
            </div>
          </div>
        </div>
      ) : !paymentConfirmed ? (
        /* ── PAYMENT PHASE ── */
        <div className="space-y-6">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="font-heading font-bold text-lg">Pago Requerido</h2>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Para publicar tus <span className="font-semibold text-primary">{missions.length}</span> misiones, realiza el pago de <span className="font-semibold text-primary">${totalCost.toLocaleString()} USDT</span> a la siguiente wallet de GOPHORA.
            </p>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Misiones</p>
              <p className="text-2xl font-heading font-bold text-primary">{missions.length}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Horas</p>
              <p className="text-2xl font-heading font-bold">{totalHours}h</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Total a Pagar</p>
              <p className="text-2xl font-heading font-bold text-primary">${totalCost.toLocaleString()}</p>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider">Datos de Pago</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-muted-foreground font-heading uppercase">Red</p>
                  <p className="font-heading font-bold text-sm">BNB Smart Chain (BSC) — BEP20</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-muted-foreground font-heading uppercase">Moneda</p>
                  <p className="font-heading font-bold text-sm">USDT (Tether)</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Binance Pay ID</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm font-bold text-primary break-all">514263259</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 w-8 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText('514263259');
                      toast.success('ID copiado al portapapeles');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Monto Exacto</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-lg font-bold text-primary">{totalCost.toLocaleString()} USDT</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 w-8 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(totalCost.toString());
                      toast.success('Monto copiado al portapapeles');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <p className="text-xs font-body text-yellow-700 dark:text-yellow-400 leading-relaxed">
                ⚠️ <strong>Importante:</strong> Envía exactamente <strong>{totalCost.toLocaleString()} USDT</strong> por la red <strong>BSC (BEP20)</strong> usando Binance Pay al ID indicado. Otros montos o redes pueden causar pérdida de fondos.
              </p>
            </div>
          </div>

          {/* TX Hash & Screenshot */}
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <div className="space-y-3">
              <Label className="font-heading text-xs tracking-wider uppercase">Hash de Transacción (opcional)</Label>
              <Input
                className="font-mono text-sm"
                placeholder="0x..."
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
              />
              <p className="text-xs text-muted-foreground font-body">
                Pega el hash de tu transacción para facilitar la verificación.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="font-heading text-xs tracking-wider uppercase flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Captura del Depósito
              </Label>
              {paymentScreenshotPreview ? (
                <div className="relative rounded-lg border border-border/50 overflow-hidden">
                  <img
                    src={paymentScreenshotPreview}
                    alt="Captura de depósito"
                    className="w-full max-h-64 object-contain bg-muted/30"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-xs font-heading text-destructive bg-card/80 backdrop-blur-sm"
                    onClick={() => {
                      setPaymentScreenshot(null);
                      setPaymentScreenshotPreview(null);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/30 transition-colors cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPaymentScreenshot(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setPaymentScreenshotPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-body">Sube una captura de pantalla del depósito exitoso</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">PNG, JPG hasta 5MB</p>
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setQuoteAccepted(false)}
              className="font-heading gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Button>
            <Button
              variant="hero"
              className="flex-1 font-heading gap-2"
              onClick={() => setPaymentConfirmed(true)}
            >
              <CheckCircle className="h-4 w-4" /> Ya realicé el pago
            </Button>
          </div>
        </div>
      ) : (
        /* ── PUBLISH PHASE ── */
        <div className="space-y-6">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              <h2 className="font-heading font-bold text-lg">Pago Confirmado</h2>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Has confirmado el pago de <span className="font-semibold text-primary">${totalCost.toLocaleString()} USDT</span>. 
              {txHash && <> TX: <code className="font-mono text-xs text-primary">{txHash.slice(0, 16)}...</code></>}
              {' '}Nuestro equipo verificará el pago. Publica tus misiones para que queden activas una vez verificado.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Misiones</p>
              <p className="text-2xl font-heading font-bold text-primary">{missions.length}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Horas</p>
              <p className="text-2xl font-heading font-bold">{totalHours}h</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-heading uppercase mb-1">Inversión Total</p>
              <p className="text-2xl font-heading font-bold text-primary">${totalCost.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setPaymentConfirmed(false)}
              className="font-heading gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Button>
            <Button variant="hero" className="flex-1 font-heading gap-2" disabled={publishing} onClick={handlePublish}>
              {publishing ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Publicar {missions.length} Misiones
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProjectCreate;
