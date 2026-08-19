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
    const read = () => {
      // Rounded, and ignored below 80px: browser chrome collapsing on scroll
      // moves this by a few pixels and must not shove the bar around.
      const gap = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      setInset(gap > 80 ? gap : 0);
    };
    read();
    vv.addEventListener("resize", read);
    vv.addEventListener("scroll", read);
    return () => { vv.removeEventListener("resize", read); vv.removeEventListener("scroll", read); };
  }, []);

  return inset;
}
