/* This runs BEFORE first paint, which is the only reason it is a string of
   hand-written JS instead of a component. React cannot help here: by the time
   hydration runs, the visitor has already seen the wrong theme flash.

   It also adds `js`. The reveal animations start at opacity 0, so without a
   way to tell that JS is alive, a visitor with JS off would get a page of
   invisible text.

   Dark is the default. Only a stored 'light' - a visitor who pressed the
   toggle - gives the light theme; no key, a junk value or storage that
   throws all land on dark. The layouts render `data-theme="dark"` on <html>
   as well, so a visitor with JS off gets the same page. */
const script = `(function(){var r=document.documentElement;r.classList.add('js');var t=null;try{t=localStorage.getItem('portfolio-theme')}catch(e){}r.dataset.theme=t==='light'?'light':'dark'})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
