import { useEffect, useRef } from "react";

interface UseEventListenerOptions {
  target?: EventTarget | null;
  options?: AddEventListenerOptions | boolean;
  isEnabled?: boolean;
}

export function useEventListener<TEvent extends Event>(
  eventName: string,
  handler: (event: TEvent) => void,
  { target, options, isEnabled = true }: UseEventListenerOptions = {}
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!isEnabled) return;

    const eventTarget = target ?? (typeof window !== "undefined" ? window : null);
    if (!eventTarget) return;

    function listener(event: Event) {
      handlerRef.current(event as TEvent);
    }

    eventTarget.addEventListener(eventName, listener, options);

    return () => {
      eventTarget.removeEventListener(eventName, listener, options);
    };
  }, [eventName, isEnabled, options, target]);
}
