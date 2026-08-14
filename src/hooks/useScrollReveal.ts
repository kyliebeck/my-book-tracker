import { useEffect } from "react";

/**
 * Reveals grid items as they scroll into view.
 *
 * The CSS-only entrance animation fires on mount, so everything below the fold
 * finishes animating before you ever see it. This observes items instead and
 * adds `.revealed` when each one actually enters the viewport, staggered by
 * position within its row.
 *
 * Pass a dependency that changes when the list content changes, so newly
 * rendered items get observed too.
 */
export default function useScrollReveal(dependency: unknown) {
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const items = document.querySelectorAll<HTMLElement>(
            ".book-list > li:not(.revealed), .collection-grid > li:not(.revealed)"
        );
        if (items.length === 0) return;

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target as HTMLElement;
                    // Stagger across a row without needing to know the column count.
                    const index = Number(el.dataset.revealIndex ?? 0);
                    el.style.transitionDelay = `${(index % 5) * 55}ms`;
                    el.classList.add("revealed");
                    obs.unobserve(el);
                });
            },
            { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }
        );

        items.forEach((el, i) => {
            el.dataset.revealIndex = String(i);
            el.classList.add("reveal");
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, [dependency]);
}
