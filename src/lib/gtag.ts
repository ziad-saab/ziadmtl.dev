export const GA_TRACKING_ID = 'G-BRNWXBNJMK';

declare global {
  function gtag(cmd: string, id: string, params: { [key: string] : unknown }): void;
}

export const pageview = (url: URL) => {
  window.gtag?.('config', GA_TRACKING_ID, {
    page_path: url,
  });
};