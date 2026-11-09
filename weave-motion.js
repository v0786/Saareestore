export function createWeave(canvas, items, reducedMotion) {
  const context = canvas.getContext('2d');
  if (!context) return null;

  const textiles = items.map(item => {
    const texture = new Image();
    texture.src = `assets/${item.id}-front.webp`;
    return {texture, color:item.color};
  });
  const beat = 2 * Math.PI / textiles.length;
  let selected = 0;
  let frame = 0;
  let started = false;
  let startTime;
  let progress = 0;

  function paint(reveal, fold) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const scale = Math.min(devicePixelRatio, 2);
    const pixelWidth = Math.round(width * scale);
    const pixelHeight = Math.round(height * scale);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    const strip = Math.max(3, width / 230);
    const amplitude = height * .235;
    const ribbon = height * .245;
    const ribbons = textiles.map((textile,index) => {
      const phase = (index - selected) * beat;
      const angle = x => x / width * Math.PI * 4 + phase + fold;
      return {...textile, index, angle, reveal:Math.min(1, Math.max(0, reveal * 1.26 - index * .13))};
    });

    for (let x = 0; x < width; x += strip) {
      const ordered = ribbons.filter(item => x < width * item.reveal)
        .sort((a,b) => Math.cos(a.angle(x)) - Math.cos(b.angle(x)));
      for (const {texture,color,angle,index,reveal:edge} of ordered) {
        const y = height / 2 + Math.sin(angle(x)) * amplitude;
        const slope = (Math.sin(angle(x + strip)) - Math.sin(angle(x))) * amplitude / strip;
        const depth = Math.cos(angle(x));
        const length = Math.min(strip + .65, width * edge - x);
        const thickness = ribbon * (.77 + .23 * Math.abs(depth));
        const motif = (x / ribbon * 31 + index * 21) % 230;
        const sourceX = 124 + Math.min(motif,230 - motif);
        context.save();
        context.transform(1,slope,0,1,x,y - thickness / 2);
        context.fillStyle = color;
        context.fillRect(0,0,length,thickness);
        if (texture.complete && texture.naturalWidth) {
          context.drawImage(texture,sourceX,112,2,236,0,0,length,thickness);
        }
        const shade = context.createLinearGradient(0,0,0,thickness);
        shade.addColorStop(0,`rgba(255,232,182,${.12 + depth * .08})`);
        shade.addColorStop(.52,`rgba(0,0,0,${.17 - depth * .1})`);
        shade.addColorStop(1,`rgba(24,12,17,${.25 - depth * .11})`);
        context.fillStyle = shade;
        context.fillRect(0,0,length,thickness);
        context.restore();
      }
    }
  }

  function tick(now) {
    startTime ??= now;
    progress = Math.min((now - startTime) / 1850, 1);
    const eased = 1 - (1 - progress) ** 2;
    paint(eased, (1 - eased) * 2.4);
    frame = progress < 1 ? requestAnimationFrame(tick) : 0;
  }

  function play(index = selected) {
    selected = index;
    started = true;
    cancelAnimationFrame(frame);
    frame = 0;
    startTime = undefined;
    if (reducedMotion.matches) {
      progress = 1;
      paint(1,0);
    } else {
      frame = requestAnimationFrame(tick);
    }
  }

  const redraw = () => { if (started && !frame) paint(progress,0); };
  textiles.forEach(({texture}) => texture.addEventListener('load',redraw));
  new ResizeObserver(redraw).observe(canvas);
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    if (!started) play();
  }, {threshold:.18});
  observer.observe(canvas);
  reducedMotion.addEventListener('change', () => { if (started) play(); });

  return play;
}
