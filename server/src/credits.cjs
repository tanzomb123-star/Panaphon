/* Pricing. 1 credit per started second of video + 1 credit per 50 narration characters when voiced. */
const CHARS_PER_CREDIT = 50;
function estimateCost(story, { voice = false } = {}) {
  const seconds = story.shots.reduce((s, sh) => s + sh.dur, 0);
  const chars = story.shots.reduce((s, sh) => s + (sh.text ? [...sh.text].length : 0), 0);
  return Math.ceil(seconds) + (voice ? Math.ceil(chars / CHARS_PER_CREDIT) : 0);
}
module.exports = { estimateCost, CHARS_PER_CREDIT };
