import { LIGHT_QUERY, THEME_KEY } from '@/lib/theme';

/* This runs BEFORE first paint, which is the only reason it is a string of
   hand-written JS instead of a component. React cannot help here: by the time
   hydration runs, the visitor has already seen the wrong theme flash.

   It also adds `js`. The reveal animations start at opacity 0, so without a
   way to tell that JS is alive, a visitor with JS off would get a page of
   invisible text.

   It resolves the theme the way lib/theme.ts does - `readPref` then
   `resolveTheme` - written out by hand because nothing can be imported
   into a string. Dark is the default: no key, a junk value or storage that
   throws all land on dark. 'system' asks the OS once here; after hydration
   the toggle keeps listening for the OS to change. The layouts render
   `data-theme="dark"` and `data-theme-pref="dark"` on <html> as well, so a
   visitor with JS off gets the same page. */
const script = `(function(){var r=document.documentElement;r.classList.add('js');var p=null;try{p=localStorage.getItem('${THEME_KEY}')}catch(e){}if(p!=='light'&&p!=='system'){p='dark'}r.dataset.themePref=p;r.dataset.theme=p==='system'?(window.matchMedia('${LIGHT_QUERY}').matches?'light':'dark'):p})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
