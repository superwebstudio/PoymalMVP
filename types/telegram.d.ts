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
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebAppApi;
  };
}
