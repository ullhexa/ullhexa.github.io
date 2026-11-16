// Keep zoom inside the existing frame; artwork is a background so native image
// text recognition cannot intercept the gallery's pointer controls.
export function mountGalleryZoom(frame, artwork, initialSlide) {
  let slide = initialSlide;
  let zoomed = false;
  let position = { x: 0.5, y: 0.5 };
  const clamp = value => Math.max(0, Math.min(1, value));

  function paintZoom() {
    const width = artwork.clientWidth;
    const height = artwork.clientHeight;
    if (!width || !height) return;
    const fit = Math.min(width / slide.width, height / slide.height);
    // A modest, consistent enlargement of the fitted image. Keep narrow images
    // centered instead of forcing them to fill the width at excessive zoom.
    const scale = fit * 1.6;
    const imageWidth = slide.width * scale;
    const imageHeight = slide.height * scale;
    artwork.style.backgroundSize = `${imageWidth}px ${imageHeight}px`;
    const x = (width - imageWidth) * (imageWidth > width ? position.x : 0.5);
    const y = (height - imageHeight) * (imageHeight > height ? position.y : 0.5);
    artwork.style.backgroundPosition = `${x}px ${y}px`;
  }

  function setZoom(value) {
    zoomed = value;
    frame.classList.toggle('is-zoomed', value);
    frame.setAttribute('aria-pressed', String(value));
    frame.setAttribute('aria-label', `${value ? 'Zoom out of' : 'Zoom into'} screenshot: ${slide.title}`);
    if (value) paintZoom();
    else {
      position = { x: 0.5, y: 0.5 };
      artwork.style.backgroundSize = 'contain';
      artwork.style.backgroundPosition = 'center';
    }
  }

  function followPointer(event) {
    const rect = artwork.getBoundingClientRect();
    position = {
      x: rect.width ? clamp((event.clientX - rect.left) / rect.width) : 0.5,
      y: rect.height ? clamp((event.clientY - rect.top) / rect.height) : 0.5
    };
  }

  function setImage(nextSlide) {
    slide = nextSlide;
    artwork.style.backgroundImage = `url(${JSON.stringify(slide.src)})`;
    artwork.setAttribute('aria-label', slide.alt);
    setZoom(false);
  }

  frame.addEventListener('click', event => {
    if (!zoomed && event.detail > 0) followPointer(event);
    setZoom(!zoomed);
  });
  frame.addEventListener('pointermove', event => {
    if (!zoomed) return;
    followPointer(event);
    paintZoom();
  });
  const reset = () => setZoom(false);
  frame.addEventListener('pointerleave', event => {
    // Hold the nearest edge when the pointer slips outside; only a deliberate
    // click or keyboard action dismisses zoom. Touch departure is not panning.
    if (!zoomed || event.pointerType === 'touch') return;
    followPointer(event);
    paintZoom();
  });
  frame.ownerDocument.addEventListener('click', event => {
    if (zoomed && !frame.contains(event.target)) reset();
  });
  frame.addEventListener('keydown', event => {
    if (!zoomed || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const movement = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[event.key];
    if (event.key !== 'Escape' && !movement) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') reset();
    else {
      position.x = clamp(position.x + movement[0]);
      position.y = clamp(position.y + movement[1]);
      paintZoom();
    }
  });
  setImage(initialSlide);
  return { setImage, reset, refresh: () => { if (zoomed) paintZoom(); } };
}
