type OnEnter = () => void

/**
 * One IntersectionObserver for the whole site. `Reveal` used to create one per
 * instance, which meant ~25 observers today and would mean ~45 once lists are
 * broken up per item. Thresholds match the previous per-instance config so the
 * reveal timing is unchanged.
 */
let observer: IntersectionObserver | null = null
const callbacks = new Map<Element, OnEnter>()

function getObserver(): IntersectionObserver {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const onEnter = callbacks.get(entry.target)
        // Unsubscribe before invoking: reveals are one-shot.
        observer?.unobserve(entry.target)
        callbacks.delete(entry.target)
        onEnter?.()
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  )
  return observer
}

/** Calls `onEnter` once, the first time `el` scrolls into view. */
export function observeOnce(el: Element, onEnter: OnEnter): () => void {
  const io = getObserver()
  callbacks.set(el, onEnter)
  io.observe(el)
  return () => {
    io.unobserve(el)
    callbacks.delete(el)
  }
}
