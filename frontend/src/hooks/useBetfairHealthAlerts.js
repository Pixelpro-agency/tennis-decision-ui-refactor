import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useBetfairHealthAlerts({ betfairHealth, hasDashboard }) {
  const [betfairHealthTransition, setBetfairHealthTransition] = useState(null);
  const prevHealthStatus = useRef(null);
  const transitionTimeout = useRef(null);

  useEffect(() => {
      if (!betfairHealth) return;

      const current = betfairHealth.status;
      const previous = prevHealthStatus.current;
      const isGraphLogin = betfairHealth.metrics?.graphLoginRequired === true;

      let triggerToRed = false;

      if (previous && (previous === 'green' || previous === 'yellow') && current === 'red') {
          triggerToRed = true;
      }
      else if (!previous && current === 'red' && isGraphLogin) {
          triggerToRed = true;
      }

      if (triggerToRed) {
          setBetfairHealthTransition('to-red');
          if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
          transitionTimeout.current = setTimeout(() => {
              setBetfairHealthTransition(null);
          }, 8000);
      } else if (previous === 'red' && (current === 'green' || current === 'yellow')) {
          setBetfairHealthTransition('recovered');
          if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
          transitionTimeout.current = setTimeout(() => {
              setBetfairHealthTransition(null);
          }, 8000);
      }

      prevHealthStatus.current = current;

      return () => {
          if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
      };
  }, [betfairHealth]);

  const [betfairAudioAlertEnabled, setBetfairAudioAlertEnabled] = useState(() => {
      try {
          const saved = localStorage.getItem('betfairAudioAlertEnabled');
          if (saved === null) return true;
          return saved === 'true';
      } catch {
          return true;
      }
  });

  useEffect(() => {
      try {
          localStorage.setItem('betfairAudioAlertEnabled', betfairAudioAlertEnabled ? 'true' : 'false');
      } catch {}
  }, [betfairAudioAlertEnabled]);

  const [betfairAlertToastDismissed, setBetfairAlertToastDismissed] = useState(false);

  useEffect(() => {
      if (betfairHealthTransition === 'to-red') {
          setBetfairAlertToastDismissed(false);
      }
  }, [betfairHealthTransition]);

  const playBetfairAlertBeep = useCallback(() => {
      try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;

          const ctx = new AudioCtx();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.value = 880;
          gain.gain.value = 0.08;

          oscillator.connect(gain);
          gain.connect(ctx.destination);

          oscillator.start();
          setTimeout(() => {
              try {
                  oscillator.stop();
                  ctx.close();
              } catch {}
          }, 220);
      } catch {}
  }, []);

  const isBetfairScrapeAlert = useMemo(() => {
      return (
          betfairHealth?.status === 'red' &&
          (
              betfairHealth?.metrics?.graphLoginRequired === true ||
              betfairHealth?.metrics?.graphLoginRequiredRecent === true ||
              /logout|login|required|accesso|grafico/i.test(betfairHealth?.message || '') ||
              (betfairHealth?.reasons || []).some(r => /logout|login|required|accesso|grafico/i.test(String(r)))
          )
      );
  }, [betfairHealth]);

  useEffect(() => {
      if (!betfairAudioAlertEnabled || !isBetfairScrapeAlert) return;

      playBetfairAlertBeep();

      const interval = setInterval(() => {
          playBetfairAlertBeep();
      }, 10000);

      return () => clearInterval(interval);
  }, [betfairAudioAlertEnabled, isBetfairScrapeAlert, playBetfairAlertBeep]);


  const showBetfairAlertToast =
      hasDashboard &&
      betfairHealthTransition === 'to-red' &&
      !betfairAlertToastDismissed;

  const dismissBetfairAlertToast = () => {
    setBetfairAlertToastDismissed(true);
  };

  return {
    betfairHealthTransition,
    betfairAudioAlertEnabled,
    setBetfairAudioAlertEnabled,
    showBetfairAlertToast,
    dismissBetfairAlertToast
  };
}
