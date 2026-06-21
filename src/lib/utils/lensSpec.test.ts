import { describe, expect, it } from 'vitest';
import {
	adapterName,
	compatibleMounts,
	detectMount,
	parseLensSpecs
} from './lensSpec';

describe('parseLensSpecs', () => {
	it('parses a prime with aperture', () => {
		expect(parseLensSpecs('RF 50mm F1.8 STM')).toEqual({
			isPrime: true,
			flMin: 50,
			flMax: 50,
			apertureWide: 1.8
		});
	});
	it('parses a constant-aperture zoom', () => {
		expect(parseLensSpecs('RF 70-200mm F2.8L IS')).toEqual({
			isPrime: false,
			flMin: 70,
			flMax: 200,
			apertureWide: 2.8
		});
	});
	it('parses a variable-aperture zoom', () => {
		expect(parseLensSpecs('RF 24-105mm F4-7.1 IS STM')).toEqual({
			isPrime: false,
			flMin: 24,
			flMax: 105,
			apertureWide: 4,
			apertureTele: 7.1
		});
	});
	it('parses EF 1: style apertures', () => {
		expect(parseLensSpecs('EF 35mm f/2 IS USM')).toEqual({
			isPrime: true,
			flMin: 35,
			flMax: 35,
			apertureWide: 2
		});
		expect(parseLensSpecs('EF 100mm 1:2.8 Macro')).toEqual({
			isPrime: true,
			flMin: 100,
			flMax: 100,
			apertureWide: 2.8
		});
	});
	it('leaves unknown fields undefined', () => {
		expect(parseLensSpecs('Lens Pro')).toEqual({});
	});
});

describe('detectMount', () => {
	it('detects EF, EF-S, RF, RF-S prefixes', () => {
		expect(detectMount('EF 50mm f/1.8 STM', 'rf')).toBe('ef');
		expect(detectMount('EF-S 18-55mm', 'rf')).toBe('ef-s');
		expect(detectMount('RF 24-105mm', 'rf')).toBe('rf');
		expect(detectMount('RF-S 18-45mm', 'rf')).toBe('rf-s');
	});
	it('falls back when no mount prefix is present', () => {
		expect(detectMount('Lens Pro 50mm', 'rf')).toBe('rf');
	});
});

describe('mount compatibility + adapters', () => {
	it('RF body accepts RF, RF-S, EF, EF-S', () => {
		expect(compatibleMounts('rf').sort()).toEqual(['ef', 'ef-s', 'rf', 'rf-s']);
	});
	it('reports the EF-EOS R adapter for EF lenses on RF', () => {
		expect(adapterName('rf', 'ef')).toBe('EF-EOS R adapter');
		expect(adapterName('rf', 'ef-s')).toBe('EF-EOS R adapter');
		expect(adapterName('rf', 'rf')).toBeNull();
	});
});
