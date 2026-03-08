import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Wallet, Building2, Bitcoin, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: string;
  amount: number;
  method: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  bank_name?: string;
  crypto_network?: string;
  crypto_address?: string;
}

const BalanceModule = () => {
  const { user } = useAuth();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [method, setMethod] = useState<'bank' | 'crypto'>('bank');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Get funds_released applications to calculate available balance
    const { data: apps } = await supabase
      .from('mission_applications')
      .select('id, status, mission_id')
      .eq('user_id', user.id)
      .eq('status', 'funds_released');

    const releasedApps = apps || [];

    if (releasedApps.length > 0) {
      const missionIds = [...new Set(releasedApps.map(a => a.mission_id))];
      const { data: missions } = await supabase
        .from('missions')
        .select('id, reward')
        .in('id', missionIds);

      const missionMap = new Map((missions || []).map(m => [m.id, Number(m.reward)]));
      const totalReleased = releasedApps.reduce((sum, a) => sum + (missionMap.get(a.mission_id) || 0), 0);

      // Get approved/pending withdrawals to subtract from available
      const { data: withdrawalRows } = await supabase
        .from('withdrawal_requests')
        .select('amount, status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved']);

      const totalWithdrawn = (withdrawalRows || []).reduce((sum, w) => sum + Number(w.amount), 0);
      const pendingWithdrawals = (withdrawalRows || []).filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0);

      setAvailableBalance(totalReleased - totalWithdrawn);
      setPendingBalance(pendingWithdrawals);
    } else {
      setAvailableBalance(0);
      setPendingBalance(0);
    }

    // Load withdrawal history
    const { data: wRows } = await supabase
      .from('withdrawal_requests')
      .select('id, amount, method, status, admin_note, created_at, processed_at, bank_name, crypto_network, crypto_address')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setWithdrawals(wRows as WithdrawalRequest[] || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (numAmount > availableBalance) {
      toast.error('El monto excede tu balance disponible');
      return;
    }

    if (method === 'bank') {
      if (!bankName.trim() || !bankAccount.trim() || !bankHolder.trim()) {
        toast.error('Completa todos los campos bancarios');
        return;
      }
    } else {
      if (!cryptoNetwork.trim() || !cryptoAddress.trim()) {
        toast.error('Completa la red y dirección de wallet');
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: user!.id,
        amount: numAmount,
        method,
        bank_name: method === 'bank' ? bankName.trim() : null,
        bank_account: method === 'bank' ? bankAccount.trim() : null,
        bank_holder: method === 'bank' ? bankHolder.trim() : null,
        crypto_network: method === 'crypto' ? cryptoNetwork.trim() : null,
        crypto_address: method === 'crypto' ? cryptoAddress.trim() : null,
      });

      if (error) throw error;
      toast.success('Solicitud de retiro enviada correctamente');
      setShowForm(false);
      setAmount('');
      setBankName('');
      setBankAccount('');
      setBankHolder('');
      setCryptoNetwork('');
      setCryptoAddress('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
    approved: { label: 'Aprobado', color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
    rejected: { label: 'Rechazado', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-body">Balance disponible</span>
          </div>
          <div className="text-3xl font-heading font-bold">${availableBalance.toLocaleString()}</div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground font-body">En proceso de retiro</span>
          </div>
          <div className="text-3xl font-heading font-bold">${pendingBalance.toLocaleString()}</div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 flex items-center justify-center">
          <Button
            variant="hero"
            className="gap-2"
            onClick={() => setShowForm(!showForm)}
            disabled={availableBalance <= 0}
          >
            <Wallet className="h-4 w-4" />
            {availableBalance > 0 ? 'Solicitar retiro' : 'Sin fondos disponibles'}
          </Button>
        </div>
      </div>

      {/* Withdrawal Form */}
      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-4">
          <h3 className="font-heading font-bold">Solicitar retiro</h3>

          <div>
            <label className="text-sm font-heading font-semibold mb-2 block">Monto (máx. ${availableBalance.toLocaleString()})</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={availableBalance}
              className="max-w-xs"
            />
          </div>

          <div>
            <label className="text-sm font-heading font-semibold mb-2 block">Método de retiro</label>
            <div className="flex gap-2">
              <Button
                variant={method === 'bank' ? 'default' : 'outline'}
                size="sm"
                className="gap-2 font-heading text-xs"
                onClick={() => setMethod('bank')}
              >
                <Building2 className="h-3 w-3" /> Cuenta bancaria
              </Button>
              <Button
                variant={method === 'crypto' ? 'default' : 'outline'}
                size="sm"
                className="gap-2 font-heading text-xs"
                onClick={() => setMethod('crypto')}
              >
                <Bitcoin className="h-3 w-3" /> Billetera crypto
              </Button>
            </div>
          </div>

          {method === 'bank' ? (
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block">Nombre del banco</label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ej: Bancolombia" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block">Número de cuenta</label>
                <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Ej: 1234567890" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block">Titular de la cuenta</label>
                <Input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="Nombre completo" />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block">Red</label>
                <Input value={cryptoNetwork} onChange={(e) => setCryptoNetwork(e.target.value)} placeholder="Ej: Ethereum, Tron, BSC" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block">Dirección de wallet</label>
                <Input value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)} placeholder="0x..." />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button className="gap-2 font-heading text-xs" onClick={handleSubmit} disabled={submitting}>
              <Send className="h-3 w-3" /> {submitting ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
            <Button variant="outline" className="font-heading text-xs" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card">
          <div className="p-6 border-b border-border/50">
            <h3 className="font-heading font-bold">Historial de retiros</h3>
          </div>
          <div className="divide-y divide-border/50">
            {withdrawals.map((w) => {
              const cfg = statusConfig[w.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={w.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${w.method === 'bank' ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
                      {w.method === 'bank' ? (
                        <Building2 className={`h-4 w-4 ${w.method === 'bank' ? 'text-blue-500' : 'text-orange-500'}`} />
                      ) : (
                        <Bitcoin className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">
                        ${Number(w.amount).toLocaleString()} — {w.method === 'bank' ? w.bank_name : `${w.crypto_network}`}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {new Date(w.created_at).toLocaleDateString()} • {w.method === 'bank' ? 'Transferencia bancaria' : `Wallet: ${w.crypto_address?.slice(0, 10)}...`}
                      </p>
                      {w.admin_note && (
                        <p className="text-xs text-muted-foreground font-body italic mt-1">Nota: {w.admin_note}</p>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-heading font-semibold px-3 py-1 rounded-full ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceModule;
