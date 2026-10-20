import React, { useState } from 'react';
import { 
  DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Receipt, 
  ShieldCheck, AlertCircle, Wrench, Calendar, Sparkles, Tag
} from 'lucide-react';
import { VehicleItem, VehicleExpenseItem, VehicleExpenseCategory } from '../../../db/types';
import { calculateVehicleFinancials, getExpenseCategoryLabel } from '../../../utils/helpers';

interface DetailExpensesTabProps {
  car: VehicleItem;
  onAddExpense?: (carId: string, expense: Omit<VehicleExpenseItem, 'id'>) => void;
  onDeleteExpense?: (carId: string, expenseId: string) => void;
  onUpdatePurchasePrice?: (carId: string, purchasePriceEur: number) => void;
  onUpdateSaleInfo?: (carId: string, soldPriceEur: number, soldAt?: string) => void;
  showToast?: (msg: string) => void;
}

export const DetailExpensesTab: React.FC<DetailExpensesTabProps> = ({
  car,
  onAddExpense,
  onDeleteExpense,
  onUpdatePurchasePrice,
  onUpdateSaleInfo,
  showToast
}) => {
  const financials = calculateVehicleFinancials(car);

  // Stare formular adăugare cheltuială
  const [category, setCategory] = useState<VehicleExpenseCategory>('mechanical_repairs');
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Editare inline preț de achiziție
  const [isEditingPurchasePrice, setIsEditingPurchasePrice] = useState(false);
  const [customPurchasePrice, setCustomPurchasePrice] = useState(financials.purchasePriceEur.toString());

  // Editare detalii vânzare (dacă mașina este marcată sold)
  const [isEditingSaleInfo, setIsEditingSaleInfo] = useState(false);
  const [customSoldPrice, setCustomSoldPrice] = useState((car.soldPriceEur || car.priceEur).toString());
  const [customSoldAt, setCustomSoldAt] = useState(car.soldAt ? car.soldAt.split('T')[0] : new Date().toISOString().split('T')[0]);

  const handleSavePurchasePrice = () => {
    const parsed = parseInt(customPurchasePrice, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdatePurchasePrice?.(car.id, parsed);
      setIsEditingPurchasePrice(false);
      showToast?.(`Prețul de achiziție a fost setat la ${parsed.toLocaleString('ro-RO')} €.`);
    }
  };

  const handleSaveSaleInfo = () => {
    const parsed = parseInt(customSoldPrice, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const soldIso = customSoldAt ? `${customSoldAt}T12:00:00.000Z` : new Date().toISOString();
      onUpdateSaleInfo?.(car.id, parsed, soldIso);
      setIsEditingSaleInfo(false);
      showToast?.(`Datele de vânzare au fost salvate (${parsed.toLocaleString('ro-RO')} € la data de ${customSoldAt}).`);
    }
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(amountStr, 10);
    if (!title.trim() || isNaN(amount) || amount <= 0) {
      showToast?.('Te rugăm să introduci o descriere și o sumă validă.');
      return;
    }

    if (onAddExpense) {
      onAddExpense(car.id, {
        category,
        title: title.trim(),
        amountEur: amount,
        date: date || new Date().toISOString().split('T')[0],
        invoiceRef: invoiceRef.trim() || undefined
      });
      showToast?.(`Cheltuiala de ${amount} € a fost adăugată cu succes.`);
      // Resetare formular
      setTitle('');
      setAmountStr('');
      setInvoiceRef('');
    }
  };

  const expensesList = car.expenses || [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* 🔒 Notă de Confidențialitate Dealer */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Registru Financiar Intern (Dealer Only):</strong> Datele de achiziție, reparații și marjă de profit nu sunt niciodată afișate pe fațada publică a site-ului.
          </span>
        </div>
        <span className="text-[11px] font-mono text-amber-400/80 bg-amber-500/15 px-2 py-0.5 rounded">
          {car.status === 'sold' ? 'STATUS: VÂNDUTĂ' : 'STATUS: ÎN STOC'}
        </span>
      </div>

      {/* 📊 4 Carduri KPI Financiare */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Card 1: Preț Achiziție */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Preț Achiziție</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-400" />
          </div>
          {isEditingPurchasePrice ? (
            <div className="mt-1 flex items-center gap-1.5">
              <input 
                type="number"
                value={customPurchasePrice}
                onChange={(e) => setCustomPurchasePrice(e.target.value)}
                className="w-20 bg-black/60 border border-amber-500/50 rounded px-2 py-0.5 text-white font-mono text-sm focus:outline-none"
                autoFocus
              />
              <button 
                onClick={handleSavePurchasePrice}
                className="px-2 py-0.5 rounded bg-amber-500 text-black font-bold text-xs"
              >
                OK
              </button>
            </div>
          ) : (
            <div 
              onClick={() => setIsEditingPurchasePrice(true)}
              className="cursor-pointer group flex items-baseline gap-1"
              title="Apasă pentru a edita prețul de achiziție"
            >
              <span className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {financials.purchasePriceEur.toLocaleString('ro-RO')} €
              </span>
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">✏️</span>
            </div>
          )}
          <span className="text-[10px] text-zinc-500 mt-1">Cost cumpărare vehicul</span>
        </div>

        {/* Card 2: Total Cheltuieli Înregistrate */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Cheltuieli Pregătire</span>
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-300">
            {financials.totalExpensesEur.toLocaleString('ro-RO')} €
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">
            {financials.expensesCount} {financials.expensesCount === 1 ? 'înregistrare' : 'înregistrări'}
          </span>
        </div>

        {/* Card 3: Investiție Totală */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Capital Total Investit</span>
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400">
            {financials.totalInvestedEur.toLocaleString('ro-RO')} €
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Achiziție + Toate cheltuielile</span>
        </div>

        {/* Card 4: Profit Net & Marjă */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between ${
          financials.isProfitable 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-rose-500/10 border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={financials.isProfitable ? 'text-emerald-300' : 'text-rose-300'}>
              {car.status === 'sold' ? 'Profit Net Încasat' : 'Profit Net Estimat'}
            </span>
            {financials.isProfitable ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-extrabold ${financials.isProfitable ? 'text-emerald-300' : 'text-rose-300'}`}>
              {financials.netProfitEur > 0 ? '+' : ''}{financials.netProfitEur.toLocaleString('ro-RO')} €
            </span>
            <span className={`text-xs font-mono font-bold ${financials.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({financials.profitMarginPct}%)
            </span>
          </div>
          {car.status === 'sold' ? (
            isEditingSaleInfo ? (
              <div className="mt-2 space-y-1.5 p-2 bg-black/60 rounded-lg border border-amber-500/40">
                <div className="text-[10px] text-amber-300 font-semibold">Preț Încasat & Dată Vânzare:</div>
                <div className="flex gap-1.5 items-center flex-wrap">
                  <input
                    type="number"
                    value={customSoldPrice}
                    onChange={(e) => setCustomSoldPrice(e.target.value)}
                    className="w-20 bg-black/80 border border-white/20 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                    placeholder="EUR"
                  />
                  <input
                    type="date"
                    value={customSoldAt}
                    onChange={(e) => setCustomSoldAt(e.target.value)}
                    className="bg-black/80 border border-white/20 rounded px-1 py-0.5 text-[10px] text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSaleInfo}
                    className="px-2 py-0.5 bg-emerald-500 text-black text-[11px] font-bold rounded"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSaleInfo(false)}
                    className="px-1.5 py-0.5 bg-white/10 text-zinc-400 text-[11px] rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingSaleInfo(true)}
                className="text-[10px] text-zinc-400 mt-1 cursor-pointer group flex items-center justify-between hover:text-white"
                title="Apasă pentru a ajusta prețul negociat și data vânzării"
              >
                <span>Vânzare: <strong className="text-white">{financials.effectiveSalePriceEur.toLocaleString('ro-RO')} €</strong> • Dată: <strong className="text-emerald-400">{car.soldAt?.split('T')[0] || 'Înregistrată'}</strong></span>
                <span className="text-[10px] text-zinc-500 group-hover:text-amber-400">✏️</span>
              </div>
            )
          ) : (
            <span className="text-[10px] text-zinc-400 mt-1">
              La preț listă: {financials.effectiveSalePriceEur.toLocaleString('ro-RO')} €
            </span>
          )}
        </div>

      </div>

      {/* ➕ Formular Adăugare Cheltuială Nouă */}
      <div className="bg-[#151518] border border-white/[0.08] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-amber-400" /> Adaugă Cheltuială Nouă pe acest Vehicul
        </h3>

        <form onSubmit={handleSubmitExpense} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Categorie */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Categorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VehicleExpenseCategory)}
              className="w-full bg-[#1b1b1f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
            >
              <option value="mechanical_repairs">Reparații Mecanice</option>
              <option value="purchase_transport">Transport / Platformă</option>
              <option value="rar_registration">RAR / Înmatriculare / CIV</option>
              <option value="detailing_cleaning">Detailing / Polish / Spălare</option>
              <option value="bodywork_paint">Tinichigerie / Vopsitorie</option>
              <option value="parts">Piese & Consumabile</option>
              <option value="marketing_ads">Promovare OLX / Ads</option>
              <option value="other">Alte Cheltuieli</option>
            </select>
          </div>

          {/* Titlu / Descriere */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Descriere Cheltuială</label>
            <input 
              type="text"
              placeholder="ex: Schimb distribuție + ulei sau Platformă Germania"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1b1b1f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
              required
            />
          </div>

          {/* Sumă EUR */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Sumă (EUR)</label>
            <input 
              type="number"
              placeholder="ex: 450"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full bg-[#1b1b1f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none font-mono"
              required
              min="1"
            />
          </div>

          {/* Buton Adaugă */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full h-[38px] bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Adaugă Cheltuială
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/[0.05]">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">Data Înregistrării</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#1b1b1f] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">Număr Factură / Bon Fiscal (Opțional)</label>
            <input 
              type="text"
              placeholder="ex: Factura #7412 / Service Cluj"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              className="w-full bg-[#1b1b1f] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 📋 Tabel Istoric Cheltuieli Înregistrate */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h4 className="font-bold text-xs text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-400" /> Istoric Cheltuieli ({expensesList.length})
          </h4>
          <span className="text-[11px] text-zinc-400">
            Total Înregistrat: <strong className="text-white">{financials.totalExpensesEur.toLocaleString('ro-RO')} €</strong>
          </span>
        </div>

        {expensesList.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            Nu a fost înregistrată încă nicio cheltuială suplimentară pe acest vehicul.
            <p className="text-[11px] text-zinc-600 mt-1">Folosește formularul de mai sus pentru a adăuga transportul, reparațiile sau detailing-ul.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Categorie</th>
                  <th className="py-2.5 px-4">Descriere</th>
                  <th className="py-2.5 px-4">Dată</th>
                  <th className="py-2.5 px-4">Ref. Factură</th>
                  <th className="py-2.5 px-4 text-right">Sumă EUR</th>
                  <th className="py-2.5 px-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {expensesList.map((exp) => {
                  const meta = getExpenseCategoryLabel(exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${meta.badgeBg} ${meta.badgeText}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{exp.title}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">{exp.date}</td>
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">{exp.invoiceRef || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                        {exp.amountEur.toLocaleString('ro-RO')} €
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            onDeleteExpense?.(car.id, exp.id);
                            showToast?.(`Cheltuiala „${exp.title}” a fost ștearsă.`);
                          }}
                          className="p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Șterge cheltuiala"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
