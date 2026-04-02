export const TAXIO_DATA_EVENT = 'taxio:data-updated';

export function emitTaxioDataUpdated(scope = 'global') {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(TAXIO_DATA_EVENT, {
      detail: { scope, at: Date.now() }
    })
  );
}
