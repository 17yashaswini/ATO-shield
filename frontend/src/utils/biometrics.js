export function createBiometricTracker() {
  const keyEvents = [];
  let startTime = null;

  function onKeyDown(e) {
    if (!startTime) startTime = Date.now();
    keyEvents.push({
      key: e.key,
      keyDownTime: Date.now(),
      keyUpTime: null,
    });
  }

  function onKeyUp(e) {
    const event = [...keyEvents].reverse().find(
      (k) => k.key === e.key && k.keyUpTime === null
    );
    if (event) event.keyUpTime = Date.now();
  }

  function getFeatures() {
    const processed = keyEvents
      .filter((k) => k.keyUpTime !== null)
      .map((k, i, arr) => ({
        key: k.key,
        dwellTime: k.keyUpTime - k.keyDownTime,
        flightTime: i > 0 ? k.keyDownTime - arr[i - 1].keyDownTime : 0,
      }));

    return {
      keystrokes: processed,
      totalTime: startTime ? Date.now() - startTime : 0,
      newDevice: false,
      unusualTime: isUnusualTime(),
    };
  }

  function isUnusualTime() {
    const hour = new Date().getHours();
    return hour >= 0 && hour <= 5; // 12am - 5am = unusual
  }

  function reset() {
    keyEvents.length = 0;
    startTime = null;
  }

  return { onKeyDown, onKeyUp, getFeatures, reset };
}