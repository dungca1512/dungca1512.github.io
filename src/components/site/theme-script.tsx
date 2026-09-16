/* This runs BEFORE first paint, which is the only reason it is a string of
   hand-written JS instead of a component. React cannot help here: by the time
   hydration runs, the visitor has already seen the wrong theme flash.

   It also adds `js`. The reveal animations start at opacity 0, so without a
   way to tell that JS is alive, a visitor with JS off would get a page of
   invisible text. */
const script = `(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('portfolio-theme');if(t==='dark'||t==='light'){r.dataset.theme=t}}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
