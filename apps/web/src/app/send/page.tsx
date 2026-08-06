'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Coins,
  Info,
  Loader2,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  User,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  useToast,
} from '@stellar-pay/ui';
import { useWallet } from '@stellar-pay/wallet';
import { api } from '@/lib/api';
import { isValidPublicKey, toStroops } from '@stellar-pay/shared';
import { shortKey } from '@/lib/format';
import type { AssetBalance, Contact } from '@stellar-pay/types';

// ------------------------------------------------------------------ Types

interface Destination {
  publicKey: string;
  amount: string;
}

interface SimulationResult {
  fee: string;
  warnings: string[];
  assetCode?: string;
}

// ================================================================== Contact picker

function ContactPicker({
  value,
  contacts,
  loading,
  onSelect,
  onChange,
}: {
  value: string;
  contacts: Contact[];
  loading: boolean;
  onSelect: (contact: Contact) => void;
  onChange: (publicKey: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.publicKey.toLowerCase().includes(q) ||
        (c.memo && c.memo.toLowerCase().includes(q)),
    );
  }, [contacts, query]);

  const selectedContact = useMemo(
    () => (value ? contacts.find((c) => c.publicKey === value) : undefined),
    [contacts, value],
  );

  const handleSelect = useCallback(
    (contact: Contact) => {
      onSelect(contact);
      setOpen(false);
      setQuery('');
    },
    [onSelect],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          placeholder="Search contacts or paste public key…"
          value={
            open
              ? query
              : selectedContact
                ? `${selectedContact.name} · ${shortKey(selectedContact.publicKey, 6, 4)}`
                : value
          }
          onChange={(e) => {
            if (open) {
              setQuery(e.target.value);
            } else {
              onChange(e.target.value);
              if (e.target.value.length > 0) {
                setQuery(e.target.value);
                setOpen(true);
              }
            }
          }}
          onFocus={() => {
            setOpen(true);
            setQuery(selectedContact?.name ?? value);
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!containerRef.current?.matches(':focus-within')) {
                setOpen(false);
                setQuery('');
              }
            }, 150);
          }}
          className={`pr-20 font-mono text-sm transition-all ${
            selectedContact ? 'border-emerald-500/30 bg-emerald-500/5' : ''
          }`}
          maxLength={56}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`rounded-md p-1.5 transition-colors hover:bg-accent ${
              open ? 'text-indigo-400' : 'text-muted-foreground'
            }`}
            title="Browse contacts"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          </button>
          {selectedContact && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95">
          <div className="relative mb-1 flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter contacts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 border-0 bg-transparent pl-8 text-sm shadow-none ring-0 focus-visible:ring-0"
              autoFocus
            />
          </div>
          {loading && (
            <div className="flex items-center gap-2 px-2 py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts…
            </div>
          )}
          {!loading && contacts.length === 0 && (
            <div className="space-y-1 px-3 py-6 text-center">
              <User className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">No contacts yet</p>
              <p className="text-xs text-muted-foreground/70">
                Paste a public key or <a href="/contacts" className="text-indigo-400 underline">add a contact</a>
              </p>
            </div>
          )}
          {!loading && contacts.length > 0 && filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No contacts match &ldquo;{query}&rdquo;</div>
          )}
          {filtered.map((contact) => {
            const isSelected = contact.publicKey === value;
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelect(contact)}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-accent ${
                  isSelected ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : ''
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold text-xs ${
                  isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-indigo-300'
                }`}>
                  {(contact.name[0] ?? '?').toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{contact.name}</span>
                    {contact.isFavorite && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {shortKey(contact.publicKey, 10, 6)}
                    {contact.memo ? <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px]">memo: {contact.memo}</span> : null}
                  </p>
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
              </button>
            );
          })}
          {query && query.length >= 56 && isValidPublicKey(query) && !contacts.some((c) => c.publicKey === query) && (
            <button
              type="button"
              onClick={() => { onChange(query); setOpen(false); setQuery(''); }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-indigo-500/30 px-2.5 py-2 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/10"
            >
              <User className="h-4 w-4" /> Use raw key: {shortKey(query, 12, 8)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ================================================================== Send page

type Step = 'form' | 'review';

export default function SendPage() {
  const { publicKey, signTx, connected } = useWallet();
  const toast = useToast();
  const [step, setStep] = useState<Step>('form');
  const [assetCode, setAssetCode] = useState('XLM');
  const [memo, setMemo] = useState('');
  const [type, setType] = useState<'SEND' | 'SPLIT'>('SEND');
  const [destinations, setDestinations] = useState<Destination[]>([{ publicKey: '', amount: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  // Simulation state
  const [simulating, setSimulating] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (!connected) { setContactsLoading(false); return; }
    setContactsLoading(true);
    void api.users.contacts({ pageSize: 100 }).then((res) => setContacts(res.data)).catch(() => undefined).finally(() => setContactsLoading(false));
  }, [connected]);

  // Derived
  const total = destinations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const updateDestination = (index: number, patch: Partial<Destination>) => {
    setDestinations((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleContactSelect = (index: number, contact: Contact) => {
    updateDestination(index, { publicKey: contact.publicKey });
    if (contact.memo && !memo) setMemo(contact.memo);
  };

  // ---- Form validation ----
  const isFormValid = useMemo(() => {
    return destinations.every((d) => isValidPublicKey(d.publicKey) && toStroops(d.amount) > 0n);
  }, [destinations]);

  // ---- XLM balance for fee check ----
  const xlmBalance = useMemo(() => {
    const b = balances.find((a) => a.assetCode === 'XLM');
    return b ? Number(b.balance) : 0;
  }, [balances]);

  // ---- Step: Review → call simulate + fetch balances ----
  const handleReview = async () => {
    if (!publicKey || !connected) { toast.error('Connect a wallet first'); return; }
    if (!isFormValid) { toast.error('Check recipient keys and amounts'); return; }

    setSimulating(true);
    setBalanceLoading(true);
    try {
      const [simResult, walletBalances] = await Promise.all([
        api.payments.simulate({
          type,
          fromPublicKey: publicKey,
          destinations: destinations.map((d) => ({ publicKey: d.publicKey, amount: d.amount })),
          assetCode,
          memo: memo || undefined,
          memoType: 'text',
        }),
        api.wallet.balances(publicKey).catch(() => [] as AssetBalance[]),
      ]);
      setSimulation(simResult);
      setBalances(walletBalances);
      setStep('review');
    } catch (err) {
      toast.error('Simulation failed', (err as Error).message);
    } finally {
      setSimulating(false);
      setBalanceLoading(false);
    }
  };

  // ---- Step: Sign & submit ----
  const handleSignAndSubmit = async () => {
    if (!publicKey || !connected) return;
    setSubmitting(true);
    try {
      const intent = await api.payments.create({
        type,
        fromPublicKey: publicKey,
        destinations: destinations.map((d) => ({ publicKey: d.publicKey, amount: d.amount })),
        assetCode,
        memo: memo || undefined,
        memoType: 'text',
      });
      if (intent.kind === 'scheduled') {
        toast.success('Payment scheduled', intent.message);
        resetForm();
        return;
      }
      const signedXdr = await signTx(intent.unsignedXdr);
      const result = await api.request<{ status: string; hash?: string }>({
        method: 'POST',
        path: `/payments/${intent.id}/submit`,
        body: { signedXdr },
      });
      toast.success(
        result.status === 'SUCCEEDED' ? 'Payment sent' : `Payment ${result.status.toLowerCase()}`,
        result.hash,
      );
      resetForm();
    } catch (err) {
      toast.error('Payment failed', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDestinations([{ publicKey: '', amount: '' }]);
    setMemo('');
    setStep('form');
    setSimulation(null);
  };

  // ================================================================ Render

  // ---- Review step ----
  if (step === 'review') {
    const feeStroops = simulation ? Number(simulation.fee) : 0;
    const feeXlm = feeStroops / 10_000_000;
    const hasEnoughXlm = xlmBalance >= feeXlm;
    const assetBalance = balances.find((b) => b.assetCode === assetCode);
    const hasEnoughAsset = assetBalance ? Number(assetBalance.balance) >= total : false;
    const canProceed = hasEnoughXlm && hasEnoughAsset;

    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">1</span>
          <span className="text-sm text-emerald-400">Details filled</span>
          <span className="h-px flex-1 bg-border" />
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">2</span>
          <span className="text-sm text-indigo-400">Review & sign</span>
        </div>

        {/* Summary card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-400" /> Transaction summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="font-mono text-sm">{shortKey(publicKey ?? '', 10, 6)}</span>
            </div>
            {/* To */}
            {destinations.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">To {type === 'SPLIT' ? `#${i + 1}` : ''}</span>
                <div className="text-right">
                  <p className="font-mono text-sm">{shortKey(d.publicKey, 10, 6)}</p>
                  {contacts.find((c) => c.publicKey === d.publicKey) && (
                    <p className="text-xs text-emerald-400">{contacts.find((c) => c.publicKey === d.publicKey)!.name}</p>
                  )}
                </div>
              </div>
            ))}
            {/* Amount + Asset */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-mono text-lg font-semibold">
                {total.toLocaleString()} <span className="text-sm text-muted-foreground">{assetCode}</span>
              </span>
            </div>
            {memo && (
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">Memo</span>
                <span className="font-mono text-sm">{memo}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulation results */}
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-indigo-400" /> Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Fee */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-muted-foreground">Estimated network fee</span>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold">{simulation?.fee ?? '—'} stroops</p>
                <p className="font-mono text-xs text-muted-foreground">≈ {feeXlm.toFixed(7)} XLM</p>
              </div>
            </div>

            {/* XLM balance */}
            <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${hasEnoughXlm ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
              <div className="flex items-center gap-2">
                <Wallet className={`h-4 w-4 ${hasEnoughXlm ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span className="text-sm text-muted-foreground">XLM balance (for fees)</span>
              </div>
              <div className="text-right">
                {balanceLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <>
                    <p className={`font-mono text-sm font-semibold ${hasEnoughXlm ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {xlmBalance.toLocaleString()} XLM
                    </p>
                    {!hasEnoughXlm && (
                      <p className="text-xs text-rose-400">Insufficient for fees</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Asset balance */}
            {assetCode !== 'XLM' && (
              <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${hasEnoughAsset ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                <div className="flex items-center gap-2">
                  <Coins className={`h-4 w-4 ${hasEnoughAsset ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span className="text-sm text-muted-foreground">{assetCode} balance</span>
                </div>
                <div className="text-right">
                  {balanceLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <>
                      <p className={`font-mono text-sm font-semibold ${hasEnoughAsset ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {Number(assetBalance?.balance ?? 0).toLocaleString()} {assetCode}
                      </p>
                      {!hasEnoughAsset && <p className="text-xs text-rose-400">Insufficient balance</p>}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Warnings */}
            {simulation?.warnings?.length ? (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Warnings</span>
                </div>
                <ul className="space-y-1">
                  {simulation.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-300/80 flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Balance tip */}
            {!canProceed && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                <Info className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="text-xs text-rose-300/80">
                  {!hasEnoughXlm && <p>You need at least {feeXlm.toFixed(7)} XLM to cover network fees. Fund your wallet on the Stellar testnet faucet.</p>}
                  {assetCode !== 'XLM' && !hasEnoughAsset && <p className="mt-1">Your {assetCode} balance is too low for this transfer.</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('form')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            variant="gradient"
            size="lg"
            className="flex-1"
            onClick={() => void handleSignAndSubmit()}
            disabled={submitting || !canProceed}
            title={!canProceed ? 'Insufficient balance to cover this transaction' : undefined}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Sign with wallet
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          You will be asked to approve the transaction in your wallet. It will settle on the Stellar network in ~5 seconds.
        </p>
      </div>
    );
  }

  // ---- Form step ----
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a contact or paste a public key, enter the amount, review, and sign with your wallet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Details</CardTitle>
            <div className="flex gap-2">
              <Badge variant={type === 'SEND' ? 'info' : 'outline'} className="cursor-pointer" onClick={() => setType('SEND')}>Single</Badge>
              <Badge variant={type === 'SPLIT' ? 'info' : 'outline'} className="cursor-pointer" onClick={() => setType('SPLIT')}>Split / batch</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {destinations.map((destination, index) => (
            <div key={index} className={`flex gap-3 rounded-xl border p-3 ${destination.publicKey && isValidPublicKey(destination.publicKey) ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-transparent'}`}>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Recipient {type === 'SPLIT' ? `#${index + 1}` : ''}</Label>
                  {contactsLoading ? null : contacts.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{contacts.length} contact{contacts.length !== 1 ? 's' : ''} available</span>
                  )}
                </div>
                <ContactPicker value={destination.publicKey} contacts={contacts} loading={contactsLoading}
                  onSelect={(contact) => handleContactSelect(index, contact)}
                  onChange={(publicKey) => updateDestination(index, { publicKey })}
                />
              </div>
              <div className="w-32 space-y-1.5">
                <Label>Amount</Label>
                <Input placeholder="0.0" value={destination.amount} onChange={(e) => updateDestination(index, { amount: e.target.value })} className="font-mono" />
              </div>
              {destinations.length > 1 && (
                <button className="mt-7 text-muted-foreground transition-colors hover:text-destructive"
                  onClick={() => setDestinations((prev) => prev.filter((_, i) => i !== index))} title="Remove recipient">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {type === 'SPLIT' && (
            <Button variant="outline" size="sm" onClick={() => setDestinations((prev) => [...prev, { publicKey: '', amount: '' }])}>
              <Plus className="h-4 w-4" /> Add recipient
            </Button>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Asset</Label>
              <Select value={assetCode} onValueChange={setAssetCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="XLM">XLM</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="EURT">EURT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Memo (optional)</Label>
              <Input placeholder="invoice-123" value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={28} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-mono text-lg font-semibold">{total.toLocaleString()} {assetCode}</span>
          </div>

          <Button variant="gradient" size="lg" className="w-full"
            onClick={() => void handleReview()}
            disabled={simulating || !isFormValid}
          >
            {simulating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
            {simulating ? 'Simulating…' : 'Review transaction'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
