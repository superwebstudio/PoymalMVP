export type ShareCatchOptions = {
  catchId: string;
  species?: string | null;
  title?: string;
  text?: string;
  origin?: string;
};

export type ShareCatchResult =
  | { method: 'native' }
  | { method: 'telegram' }
  | { method: 'clipboard' }
  | { method: 'cancelled' }
  | { method: 'failed'; error: string };

function buildCatchUrl(catchId: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/catch/${catchId}`;
}

function buildShareText(catchUrl: string, species?: string | null): string {
  return species
    ? `Check out this ${species} catch! ${catchUrl}`
    : `Check out this catch! ${catchUrl}`;
}

/**
 * Opens the device native share sheet when available (iOS Safari, Android Chrome, etc.).
 * Falls back to Telegram Mini App share, then clipboard.
 */
export async function shareCatch(
  options: ShareCatchOptions,
): Promise<ShareCatchResult> {
  const catchUrl = buildCatchUrl(options.catchId, options.origin);
  const shareText =
    options.text || buildShareText(catchUrl, options.species);
  const title =
    options.title ||
    (options.species ? `${options.species} Catch` : 'Ulov Catch');

  // Prefer native share first (iOS/Android). Telegram Mini App as fallback for in-app.
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const payload: ShareData = { title, text: shareText, url: catchUrl };
      if (
        typeof navigator.canShare === 'function' &&
        !navigator.canShare(payload)
      ) {
        // Some browsers reject url+text together; try url-only
        await navigator.share({ title, url: catchUrl });
      } else {
        await navigator.share(payload);
      }
      return { method: 'native' };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { method: 'cancelled' };
      }
      // Fall through to other methods
    }
  }

  // Telegram Mini App share
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    const telegramShareLink = `https://t.me/share/url?url=${encodeURIComponent(catchUrl)}&text=${encodeURIComponent(shareText)}`;

    if (typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(telegramShareLink);
      return { method: 'telegram' };
    }
    if (typeof tg.openLink === 'function') {
      tg.openLink(telegramShareLink);
      return { method: 'telegram' };
    }
  }

  // Clipboard fallback
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(catchUrl);
      return { method: 'clipboard' };
    }
  } catch {
    // ignore
  }

  return { method: 'failed', error: 'Unable to share' };
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}
