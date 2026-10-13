export const UI_FONT='"Ull Hexa Display", sans-serif';
let ready;
// Load both weights for canvas text too. A failed font never blocks the board.
export function uiFontsReady(){
  return ready??=typeof document==='undefined'||!document.fonts
    ?Promise.resolve()
    :Promise.allSettled([400,700].map(weight=>document.fonts.load(`${weight} 16px ${UI_FONT}`)));
}
