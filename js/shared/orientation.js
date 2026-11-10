const mq = window.matchMedia('(orientation: portrait)');
export const isPortrait = () => mq.matches;
export const onChange = cb => mq.addEventListener('change', cb);
