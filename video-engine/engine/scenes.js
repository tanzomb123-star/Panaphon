/* Scenes = WHERE/WHEN: palette + sky + backdrop + particles. Pure data. The look (looks.js) decides HOW it is drawn. */
(function (root) {
  const base = { line: '#3a2b24', sub: 'rgba(20,20,30,.72)', subText: '#ffffff', cloud: '#ffffff', sunOn: true, snowcap: false };
  const S = (o) => Object.assign({}, base, o);
  const SCENES = {
    meadow: S({ sky: 'day', backdrop: 'hills', particles: null, skyTop: '#8fd3ff', skyBot: '#e9f8ff', sun: '#ffd84a', hill1: '#9fd68a', hill2: '#7cc072', grass: '#5fae56', track: '#e8c98f', trackDash: '#fff6df', treeTop: '#7cc072', accent: '#ff7043' }),
    sunset: S({ sky: 'sunset', backdrop: 'hills', particles: null, skyTop: '#ff9a62', skyBot: '#ffe2a8', sun: '#fff1b8', hill1: '#b86f6f', hill2: '#8a4f63', grass: '#5d7f4d', track: '#d9a977', trackDash: '#ffe9c7', treeTop: '#6f7d3f', line: '#3b2230', cloud: '#ffd2b0', sub: 'rgba(40,10,30,.75)', subText: '#fff3e0', accent: '#ffb300' }),
    night: S({ sky: 'night', backdrop: 'hills', particles: 'stars', skyTop: '#0b1033', skyBot: '#3b3f87', sun: '#f4f1d0', hill1: '#2c3a6b', hill2: '#1f2a52', grass: '#27496d', track: '#51648c', trackDash: '#aab8dd', treeTop: '#2f5a5a', line: '#10132b', cloud: '#5a62a6', sub: 'rgba(0,0,0,.65)', accent: '#7c9dff' }),
    winter: S({ sky: 'day', backdrop: 'mountains', particles: 'snow', snowcap: true, skyTop: '#a9c8e8', skyBot: '#eef5fb', sun: '#fff7d6', hill1: '#8aa1bf', hill2: '#6f86a6', grass: '#f4f8fc', track: '#d7e3ef', trackDash: '#ffffff', treeTop: '#3f7a5c', line: '#2a3445', accent: '#e8505b' }),
    desert: S({ sky: 'day', backdrop: 'dunes', particles: null, skyTop: '#7fc4f0', skyBot: '#fbe9c8', sun: '#ffe066', hill1: '#e9b872', hill2: '#d79a4f', grass: '#f0c47e', track: '#e2a85e', trackDash: '#fff0d0', treeTop: '#6a9a3a', line: '#4a2e18', accent: '#d84315' }),
    beach: S({ sky: 'day', backdrop: 'sea', particles: null, skyTop: '#5ec8f2', skyBot: '#dff6ff', sun: '#ffe45c', hill1: '#2a9fd6', hill2: '#1b7fb3', grass: '#f5dfa8', track: '#ecd08d', trackDash: '#fff7e0', treeTop: '#3fa34d', line: '#1f3440', accent: '#ff6f61' }),
    forest: S({ sky: 'day', backdrop: 'forest', particles: 'leaves', skyTop: '#b9e3c6', skyBot: '#f2fbef', sun: '#fff1a0', hill1: '#4f8f5a', hill2: '#356b43', grass: '#4c8a3f', track: '#a67c52', trackDash: '#d9b98f', treeTop: '#2f6b3a', line: '#22301f', accent: '#f4a259' }),
    city: S({ sky: 'sunset', backdrop: 'city', particles: null, skyTop: '#6a7fdb', skyBot: '#ffc6a8', sun: '#fff0c9', hill1: '#4b4f73', hill2: '#33364f', grass: '#6b6f7a', track: '#8c909b', trackDash: '#f2f2f2', treeTop: '#4f8f5a', line: '#1d1f2b', cloud: '#ffd9c7', accent: '#ffcc00' })
  };
  const lib = { SCENES };
  if (typeof module !== 'undefined' && module.exports) module.exports = lib; else root.SceneLib = lib;
})(this);
