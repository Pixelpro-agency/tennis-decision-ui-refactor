import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSourceIdentityGateStatus } from '../services/liveSessionApi.js';

const STATUS_ERROR = 'Unable to load source identity status.';

function normalizeEventId(eventId) {
  return typeof eventId === 'string' ? eventId.trim() : '';
}

export function useSourceIdentityGateStatus(
  eventId,
  { enabled = true, pollingInterval = 1000 } = {}
) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollGenerationRef = useRef(0);
  const pollTimeoutRef = useRef(null);
  const activeFetchRef = useRef(null);
  const requestIdRef = useRef(0);

  const normalizedEventId = normalizeEventId(eventId);

  const clearPollTimeout = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const fetchOnce = useCallback(async ({
    currentEventId,
    currentGeneration,
    showLoading = false
  }) => {
    if (!currentEventId || pollGenerationRef.current !== currentGeneration) {
      return null;
    }

    if (
      activeFetchRef.current &&
      activeFetchRef.current.generation === currentGeneration
    ) {
      return activeFetchRef.current.promise;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    const controller = new AbortController();

    if (showLoading && pollGenerationRef.current === currentGeneration) {
      setLoading(true);
    }

    const promise = (async () => {
      try {
        const result = await fetchSourceIdentityGateStatus(currentEventId, {
          signal: controller.signal
        });

        if (pollGenerationRef.current !== currentGeneration) {
          return null;
        }

        if (result.httpStatus === 404) {
          setStatus(null);
          setError(null);
          return null;
        }

        if (
          result.httpStatus < 200 ||
          result.httpStatus >= 300 ||
          result.payload?.ok !== true
        ) {
          setStatus(null);
          setError(STATUS_ERROR);
          return null;
        }

        setStatus(result.payload);
        setError(null);
        return result.payload;
      } catch (requestError) {
        if (requestError?.name === 'AbortError') {
          return null;
        }

        if (pollGenerationRef.current !== currentGeneration) {
          return null;
        }

        setStatus(null);
        setError(STATUS_ERROR);
        return null;
      } finally {
        if (
          activeFetchRef.current &&
          activeFetchRef.current.requestId === requestId
        ) {
          activeFetchRef.current = null;

          if (showLoading && pollGenerationRef.current === currentGeneration) {
            setLoading(false);
          }
        }
      }
    })();

    activeFetchRef.current = {
      generation: currentGeneration,
      requestId,
      controller,
      promise
    };

    return promise;
  }, []);

  useEffect(() => {
    pollGenerationRef.current += 1;
    const currentGeneration = pollGenerationRef.current;
    let disposed = false;

    clearPollTimeout();

    if (activeFetchRef.current) {
      activeFetchRef.current.controller.abort();
      activeFetchRef.current = null;
    }

    if (!enabled || !normalizedEventId) {
      setStatus(null);
      setLoading(false);
      setError(null);
      setIsPolling(false);
      return undefined;
    }

    setStatus(null);
    setError(null);
    setIsPolling(true);

    const scheduleNextPoll = () => {
      if (disposed || pollGenerationRef.current !== currentGeneration) {
        return;
      }

      pollTimeoutRef.current = setTimeout(async () => {
        await fetchOnce({
          currentEventId: normalizedEventId,
          currentGeneration
        });

        scheduleNextPoll();
      }, pollingInterval);
    };

    void (async () => {
      await fetchOnce({
        currentEventId: normalizedEventId,
        currentGeneration,
        showLoading: true
      });

      scheduleNextPoll();
    })();

    return () => {
      disposed = true;
      pollGenerationRef.current += 1;
      clearPollTimeout();

      if (
        activeFetchRef.current &&
        activeFetchRef.current.generation === currentGeneration
      ) {
        activeFetchRef.current.controller.abort();
        activeFetchRef.current = null;
      }

      setIsPolling(false);
    };
  }, [
    clearPollTimeout,
    enabled,
    fetchOnce,
    normalizedEventId,
    pollingInterval
  ]);

  const refresh = useCallback(() => {
    if (!enabled || !normalizedEventId) {
      return Promise.resolve(null);
    }

    return fetchOnce({
      currentEventId: normalizedEventId,
      currentGeneration: pollGenerationRef.current,
      showLoading: true
    });
  }, [enabled, fetchOnce, normalizedEventId]);

  return {
    status,
    loading,
    error,
    isPolling,
    refresh
  };
}
