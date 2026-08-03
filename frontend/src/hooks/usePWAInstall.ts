import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.deferredPWAInstallPrompt) {
      return window.deferredPWAInstallPrompt;
    }
    return null;
  });
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('ankurah_pwa_installed') === 'true';

      setIsStandalone(Boolean(isStandaloneMode));
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    if (window.deferredPWAInstallPrompt) {
      setDeferredPrompt(window.deferredPWAInstallPrompt);
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice && !(window.navigator as any).standalone);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
        localStorage.setItem('ankurah_pwa_installed', 'true');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      window.deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleEarlyCaptured = (e: any) => {
      if (e.detail || window.deferredPWAInstallPrompt) {
        setDeferredPrompt(e.detail || window.deferredPWAInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
      window.deferredPWAInstallPrompt = null;
      localStorage.setItem('ankurah_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-captured', handleEarlyCaptured);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-captured', handleEarlyCaptured);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    let activePrompt = deferredPrompt || window.deferredPWAInstallPrompt;

    // If activePrompt is not ready yet, wait briefly (up to 1.5s) in case beforeinstallprompt is firing
    if (!activePrompt) {
      activePrompt = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        const timer = setTimeout(() => {
          resolve(window.deferredPWAInstallPrompt || null);
        }, 1500);

        const onCaptured = (e: any) => {
          clearTimeout(timer);
          window.removeEventListener('pwa-prompt-captured', onCaptured);
          resolve(e.detail || window.deferredPWAInstallPrompt || null);
        };
        window.addEventListener('pwa-prompt-captured', onCaptured);
      });
    }

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          localStorage.setItem('ankurah_pwa_installed', 'true');
        }
        setDeferredPrompt(null);
        window.deferredPWAInstallPrompt = null;
        return choiceResult.outcome;
      } catch (err) {
        console.error('PWA install prompt error:', err);
        return 'error';
      }
    } else if (isIOS) {
      return 'ios_manual';
    }
    return 'unavailable';
  }, [deferredPrompt, isIOS]);

  return {
    isStandalone,
    isInstalled,
    canInstall: Boolean(deferredPrompt || window.deferredPWAInstallPrompt) || isIOS,
    isIOS,
    promptInstall,
  };
}
