/* Scenery props placed in world space: story.props = [{ type, x, text? }]. Ground line is y=0.
   draw(ctx, prop, palette, pen) - all shapes go through the look's pen. */
(function (root) {
  const FONT = '"Loma","Noto Sans Thai","Sarabun",sans-serif';
  const text = (c, P, s, x, y, size) => { c.fillStyle = P.line; c.font = `bold ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; };
  const PROPS = {
    tree(c, p, P, g) { c.save(); c.translate(p.x, 32); g.rect(-14, -150, 28, 150, '#7a4e2d'); for (const [dx, dy, r] of [[-50, -190, 62], [40, -200, 70], [-4, -250, 66]]) g.E(dx, dy, r, r * 0.85, 0, P.treeTop); c.restore(); },
    finish(c, p, P, g) {
      c.save(); c.translate(p.x, 0); const s = 18;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) g.rect(j * s - s, 22 + i * s * 0.85, s, s * 0.85, (i + j) % 2 ? '#111111' : '#ffffff', false);
      g.rect(-26, -150, 8, 172, '#ffffff'); g.rect(-26, -150, 96, 36, '#ffffff');
      c.fillStyle = P.accent; c.font = `bold 22px ${FONT}`; c.fillText(p.text || 'FINISH', -18, -124); c.restore();
    },
    rock(c, p, P, g) { c.save(); c.translate(p.x, 30); g.path(() => { c.moveTo(-50, 0); c.quadraticCurveTo(-46, -50, 0, -56); c.quadraticCurveTo(48, -48, 54, 0); c.closePath(); }, '#9a9a9a'); c.restore(); },
    sign(c, p, P, g) { c.save(); c.translate(p.x, 30); g.rect(-5, -110, 10, 110, '#8a5a32'); g.rect(-70, -150, 140, 50, '#f3d9a4'); text(c, P, p.text || '', 0, -125, 24); c.restore(); },
    house(c, p, P, g) { c.save(); c.translate(p.x, 30); g.rect(-90, -130, 180, 130, '#f2e2c4'); g.poly([[-110, -128], [0, -210], [110, -128]], P.accent); g.rect(-22, -70, 44, 70, '#8a5a32'); g.rect(40, -100, 34, 30, '#bfe6ff'); c.restore(); }
  };
  const lib = { PROPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = lib; else root.PropLib = lib;
})(this);
