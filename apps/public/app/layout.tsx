import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import CountryModal from '../components/CountryModal';
import MobileCta from '../components/MobileCta';
import { AppProvider } from '../components/AppProvider';
import { dictionaries } from '../lib/i18n';
import { getCountry, isLocale, isRtl, isCountryCode } from '../lib/countries';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const meta = dictionaries.en.meta;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const headerStore = headers();

  const chosen = cookieStore.get('akra_country')?.value;
  const detected = headerStore.get('x-akra-country');
  const country = getCountry(chosen || detected);
  const geo = isCountryCode(detected) ? detected : null;

  const preferred = cookieStore.get('akra_locale')?.value;
  const locale =
    isLocale(preferred) && country.locales.includes(preferred) ? preferred : country.locale;

  const chosenFlag = cookieStore.get('akra_chosen')?.value === '1';
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <AppProvider
          initialCountry={country.code}
          initialLocale={locale}
          initialChosen={chosenFlag}
          geoCountry={geo}
        >
          <Nav />
          <div className="pb-24 sm:pb-0">
            {children}
            <Footer />
          </div>
          <CountryModal />
          <MobileCta />
        </AppProvider>
      </body>
    </html>
  );
}