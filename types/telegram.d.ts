interface TelegramBackButtonApi {
  hide: () => void;
  offClick: (handler: () => void) => void;
  onClick: (handler: () => void) => void;
  show: () => void;
}

interface TelegramWebAppApi {
  BackButton?: TelegramBackButtonApi;
  openInvoice?: (
    url: string,
    callback?: (status: string) => void,
  ) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebAppApi;
  };
}
