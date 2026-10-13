// One campaign preference controls every placed copy, including future items.
export const itemBordersVisible=state=>(state.public?state.itemBorders:state.campaign?.itemBorders)!==false;
