import { emitTaxioDataUpdated } from './events';
import { ClassificacaoSalva } from './storage';

const FAVORITOS_KEY = 'taxio_favoritos';

function persist(lista: ClassificacaoSalva[]) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(lista));
  emitTaxioDataUpdated('favoritos');
}

export function adicionarFavorito(item: ClassificacaoSalva): void {
  const lista = listarFavoritos();

  if (lista.find((favorito) => favorito.id === item.id)) {
    return;
  }

  lista.unshift(item);
  persist(lista);
}

export function removerFavorito(id: string): void {
  const lista = listarFavoritos().filter((favorito) => favorito.id !== id);

  persist(lista);
}

export function listarFavoritos(): ClassificacaoSalva[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(FAVORITOS_KEY) || '[]') as ClassificacaoSalva[];
  } catch {
    return [];
  }
}

export function isFavorito(id: string): boolean {
  return listarFavoritos().some((favorito) => favorito.id === id);
}

export function toggleFavorito(item: ClassificacaoSalva): boolean {
  const favorito = isFavorito(item.id);

  if (favorito) {
    removerFavorito(item.id);
    return false;
  }

  adicionarFavorito(item);
  return true;
}
