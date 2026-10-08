import { expect, test } from '@playwright/test';

const cases = [
  { id: 'lab-opamp', name: 'severe-clipping', values: { opAmpFeedbackResistance: 100, opAmpInputResistance: 1, opAmpInputVoltage: 2, opAmpSupplyVoltage: 5 } },
  { id: 'lab-digital', name: 'setup-violation', values: { digitalClockFrequency: 100, digitalPropagationDelay: 30, digitalSetupTime: 20 } },
  { id: 'lab-mosfet', name: 'gate-off', values: { mosfetGateVoltage: 0, mosfetDutyCycle: 95 } },
  { id: 'lab-pid', name: 'high-overshoot', values: { pidDerivativeGain: 0, pidIntegralGain: 2, pidProportionalGain: 4, pidSetpoint: 90 } },
  { id: 'lab-transformer', name: 'step-up', values: { transformerPrimaryTurns: 100, transformerSecondaryTurns: 1000 } },
  { id: 'lab-transmission', name: 'matched-zero-length', values: { transmissionLoadImpedance: 50, transmissionCharacteristicImpedance: 50, transmissionElectricalLength: 0 } },
  { id: 'lab-adc', name: 'clipped-four-bit', values: { adcBitDepth: 4, adcInputAmplitude: 2.5, adcReferenceVoltage: 1, adcFilterCutoff: 12 } },
];

for (const fixture of cases) {
  test(`lab visual boundary: ${fixture.name}`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((fixture) => {
      localStorage.setItem('zyloxp-saved-lab-v1', JSON.stringify({ activeLabId: fixture.id, values: fixture.values }));
    }, fixture);
    await page.goto(`/#/labs/${fixture.id}`);
    await page.getByRole('button', { name: 'Start learning', exact: true }).click();
    const dismiss = page.getByRole('button', { name: 'Dismiss notification', exact: true });
    if (await dismiss.isVisible()) await dismiss.click();
    const visual = page.locator('.labVisualStage');
    await expect(visual).toBeVisible();
    const issues = await visual.locator('svg').evaluateAll((svgs) => svgs.flatMap((svg) => {
      const bounds = svg.getBoundingClientRect();
      return Array.from(svg.querySelectorAll('text')).filter((text) => {
        if (text.closest('[aria-hidden="true"]')) return false;
        const box = text.getBoundingClientRect();
        return box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1;
      }).map((text) => text.textContent);
    }));
    expect(issues).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (fixture.id === 'lab-opamp') {
      const box = await visual.locator('.labOpAmpOutputTrace').evaluate((path: SVGGraphicsElement) => {
        const box = path.getBBox(); return { y: box.y, height: box.height };
      });
      expect(box.y).toBeGreaterThanOrEqual(113);
      expect(box.y + box.height).toBeLessThanOrEqual(173);
    }
    if (fixture.id === 'lab-digital') await expect(visual.locator('.labLogicUnknown')).toHaveText('X');
    if (fixture.id === 'lab-mosfet') await expect(visual.locator('.labMosfetDrainWave')).toHaveAttribute('d', 'M28 128 H198');
    if (fixture.id === 'lab-pid') {
      await visual.scrollIntoViewIfNeeded();
      const box = await visual.locator('.labPidResponseTrace').evaluate((path: SVGGraphicsElement) => {
        const box = path.getBBox(); return { y: box.y, height: box.height };
      });
      expect(box.y).toBeGreaterThanOrEqual(49.99);
      expect(box.y + box.height).toBeLessThanOrEqual(158.01);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const rotor = visual.locator('.labPidRotor');
      const marker = visual.locator('.labPidResponseMarker');
      await expect.poll(() => visual.evaluate((element) => {
        const timing = (selector: string) => {
          const target = element.querySelector(selector)!;
          const effect = target.getAnimations()[0]?.effect as KeyframeEffect | undefined;
          return { duration: effect?.getTiming().duration, frames: effect?.getKeyframes().length };
        };
        const rotor = timing('.labPidRotor');
        const marker = timing('.labPidResponseMarker');
        return { rotorFrames: rotor.frames, markerFrames: marker.frames,
          synchronized: typeof rotor.duration === 'number' && rotor.duration > 0 && rotor.duration === marker.duration };
      })).toEqual({ rotorFrames: 121, markerFrames: 121, synchronized: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect.poll(() => rotor.evaluate((element) => element.getAnimations().length)).toBe(0);
      await expect.poll(() => marker.evaluate((element) => element.getAnimations().length)).toBe(0);
    }
    if (fixture.id === 'lab-transmission') await expect(visual).toContainText('∞ dB');
    if (fixture.id === 'lab-adc') {
      await expect(visual.locator('.labAdcCodeLeds circle')).toHaveCount(4);
      await expect(visual.locator('.labAdcCodeLeds circle.active')).toHaveCount(4);
    }
    await visual.screenshot({ path: testInfo.outputPath(`${fixture.name}.png`) });
    await visual.getByRole('button', { name: 'Reference', exact: true }).click();
    await expect.poll(() => visual.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(errors).toEqual([]);
  });
}
