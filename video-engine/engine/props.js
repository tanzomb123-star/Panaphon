/* Scenery props placed in world space: story.props = [{ type, x, text? }]. Ground line is y=0. */
(function (root) {
  const FONT = '"Loma","Noto Sans Thai","Sarabun",sans-serif';
  const ell = (c, P, x, y, rx, ry, fill, stroke = true) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = 3; c.strokeStyle = P.line; c.stroke(); } };
  const rect = (c, P, x, y, w, h, fill) => { c.fillStyle = fill; c.fillRect(x, y, w, h); c.lineWidth = 3; c.strokeStyle = P.line; c.strokeRect(x, y, w, h); };
  const PROPS = {
    tree(c, p, P) { c.save(); c.translate(p.x, 32); rect(c, P, -14, -150, 28, 150, '#7a4e2d'); for (const [dx, dy, r] of [[-50, -190, 62], [40, -200, 70], [-4, -250, 66]]) ell(c, P, dx, dy, r, r * 0.85, P.treeTop); c.restore(); },
    finish(c, p, P) {
      c.save(); c.translate(p.x, 0); const s = 18;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#fff'; c.fillRect(j * s - s, 22 + i * s * 0.85, s, s * 0.85); }
      rect(c, P, -26, -150, 8, 172, '#fff'); rect(c, P, -26, -150, 96, 36, '#fff');
      c.fillStyle = P.accent; c.font = `bold 22px ${FONT}`; c.fillText(p.text || 'FINISH', -18, -124); c.restore();
    },
    rock(c, p, P) { c.save(); c.translate(p.x, 30); c.beginPath(); c.moveTo(-50, 0); c.quadraticCurveTo(-46, -50, 0, -56); c.quadraticCurveTo(48, -48, 54, 0); c.closePath(); c.fillStyle = '#9a9a9a'; c.fill(); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke(); c.restore(); },
    sign(c, p, P) { c.save(); c.translate(p.x, 30); rect(c, P, -5, -110, 10, 110, '#8a5a32'); rect(c, P, -70, -150, 140, 50, '#f3d9a4'); c.fillStyle = P.line; c.font = `bold 24px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.text || '', 0, -125); c.restore(); },
    house(c, p, P) { c.save(); c.translate(p.x, 30); rect(c, P, -90, -130, 180, 130, '#f2e2c4'); c.beginPath(); c.moveTo(-110, -128); c.lineTo(0, -210); c.lineTo(110, -128); c.closePath(); c.fillStyle = P.accent; c.fill(); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke(); rect(c, P, -22, -70, 44, 70, '#8a5a32'); rect(c, P, 40, -100, 34, 30, '#bfe6ff'); c.restore(); }
  };
  const lib = { PROPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = lib; else root.PropLib = lib;
})(this);
