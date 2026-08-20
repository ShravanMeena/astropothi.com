import { useEffect, useState } from "react";

/**
 * How much of the screen the on-screen keyboard is covering.
 *
 * A `position: fixed` bar is placed against the *layout* viewport, which iOS
 * does not shrink when the keyboard opens — so the pay button sits behind the
 * keyboard. The buyer taps where they can see it, that tap only dismisses the
 * keyboard, the page reflows, and they have to tap again. That is the
 * "press it twice to pay" bug, and it is worst on the one screen where a
 * hesitation costs a sale.
 *
 * visualViewport reports the part actually visible, so the difference is the
 * keyboard. Callers lift the bar by that much and the first tap lands.
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    /**
     * Only while a field is actually focused.
     *
     * The first version read the gap unconditionally, and iOS reports a large
     * one whenever the address bar collapses on scroll — so the bar translated
     * hundreds of pixels up the page and sat in the middle of the form,
     * covering it. A keyboard is only ever open when something is focused, so
     * that is the gate.
     */
    const typing = () => {
      const el = document.activeElement;
      return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    };

    const read = () => {
      if (!typing()) return setInset(0);
      const gap = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      // Clamped to half the screen. Anything larger is not a keyboard, and
      // acting on it moves the button somewhere the reader is not looking.
      const max = Math.round(window.innerHeight * 0.5);
      setInset(gap > 100 && gap < max ? gap : 0);
    };

    read();
    vv.addEventListener("resize", read);
    vv.addEventListener("scroll", read);
    // focusout fires before the viewport settles, so re-read on the next frame.
    const later = () => requestAnimationFrame(read);
    document.addEventListener("focusin", later);
    document.addEventListener("focusout", later);
    return () => {
      vv.removeEventListener("resize", read);
      vv.removeEventListener("scroll", read);
      document.removeEventListener("focusin", later);
      document.removeEventListener("focusout", later);
    };
  }, []);

  return inset;
}
