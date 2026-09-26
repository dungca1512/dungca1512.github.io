import { LIGHT_QUERY, THEME_KEY } from '@/lib/theme';

/* This runs BEFORE first paint, which is the only reason it is a string of
   hand-written JS instead of a component. React cannot help here: by the time
   hydration runs, the visitor has already seen the wrong theme flash.

   It also adds `js`. The reveal animations start at opacity 0, so without a
   way to tell that JS is alive, a visitor with JS off would get a page of
   invisible text.

   It resolves the theme the way lib/theme.ts does - `readPref` then
   `resolveTheme` - written out by hand because nothing can be imported
   into a string. System is the default: no key, a junk value or storage
   that throws all follow the OS, which is asked once here; after hydration
   the toggle keeps listening for it to change. The layouts render
   `data-theme="dark"` and `data-theme-pref="system"` on <html>: without JS
   there is no asking the OS, and dark is the fallback it paints. */
const script = `(function(){var r=document.documentElement;r.classList.add('js');var p=null;try{p=localStorage.getItem('${THEME_KEY}')}catch(e){}if(p!=='light'&&p!=='dark'){p='system'}r.dataset.themePref=p;r.dataset.theme=p==='system'?(window.matchMedia('${LIGHT_QUERY}').matches?'light':'dark'):p})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
