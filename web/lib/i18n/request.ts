import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "fr";
  return {
    locale,
    messages: (await import(`@/i18n/messages/${locale}.json`)).default,
  };
});
