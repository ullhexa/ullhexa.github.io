// One shared switch controls all numbered Place markers and their titles.
export const placeMarkersVisible=state=>(state.public?state.placeMarkers:state.campaign?.placeMarkers)===true;
