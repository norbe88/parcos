import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RXM ErrorBoundary] Eroare necaptată interceptată:', error, errorInfo);

    // Detecție automată eroare de încărcare chunk din cache (specifică după deploy / actualizare)
    const isChunkError = 
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed') ||
      error.name === 'ChunkLoadError';

    if (isChunkError) {
      const reloadKey = 'rxm_chunk_reload_attempted';
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, 'true');
        console.warn('[RXM ErrorBoundary] ChunkLoadError detectat. Se reîncarcă automat pagina cu date noi...');
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('rxm_cars_inventory');
      localStorage.removeItem('rxm_cars_version');
      sessionStorage.clear();
    } catch {
      // Ignoră erori storage
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#121215] border border-amber-500/30 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {this.state.error?.name === 'ChunkLoadError' || 
                 this.state.error?.message?.includes('dynamically imported module') ||
                 this.state.error?.message?.includes('Importing a module script failed')
                  ? 'Reîmprospătare Necesară'
                  : 'A apărut o eroare neașteptată'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {this.state.error?.name === 'ChunkLoadError' || 
                 this.state.error?.message?.includes('dynamically imported module') ||
                 this.state.error?.message?.includes('Importing a module script failed')
                  ? 'A fost detectată o actualizare a platformei sau o nepotrivire de versiune în cache. Reîncărcați pagina.'
                  : 'A apărut o problemă la afișarea acestei secțiuni. Puteți reîncărca pagina sau reveni la ecranul principal.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reîncarcă Pagina</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all border border-white/10 active:scale-98 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Resetează Cache-ul Local & Revino</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
