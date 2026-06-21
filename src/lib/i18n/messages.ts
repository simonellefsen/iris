// UI message dictionaries + locale-aware lookups for context-derived strings
// (weather conditions, light phases, difficulty/motion enums).
//
// `en` is the source of truth for the key set; `da` is typed against it so a
// missing/extra key is a compile error. Keys are flat dotted strings so call
// sites read naturally: t('session.brief').
//
// Interpolation: {name} placeholders are replaced from the params object.
//   t('constraint.aperture', { n: 2.8 }) -> "Aperture f/2.8 or wider"

import type { UiKey } from './locales';
import type { LightPhase } from '$lib/types/context';
import type { Difficulty, MotionType } from '$lib/types/task';

export const en = {
	// ---- nav ----
	'nav.home': 'Home',
	'nav.shoot': 'Shoot',
	'nav.gear': 'Gear',
	'nav.history': 'History',
	'nav.setup': 'Setup',

	// ---- common ----
	'common.loading': 'Loading…',
	'common.cancel': 'Cancel',
	'common.retry': 'Retry',
	'common.unknownLocation': 'Unknown location',

	// ---- home ----
	'home.hero':
		"Your location-aware photography coach. Tell Iris what you're shooting with, and it'll set a task perfect for the light and weather right now — then critique your shot.",
	'home.noKeyNoteStart': 'First, add an LLM provider API key (e.g. OpenRouter) in',
	'home.noKeyNoteEnd':
		'. Iris calls the provider directly from your device — your key stays on this device.',
	'home.ready': 'Ready to shoot',
	'home.noCamera': 'No camera selected',
	'home.startSession': 'Start session →',
	'home.changeGear': 'Change gear',
	'home.howItWorks': 'How it works',
	'home.step1Pre': 'Pick your camera and lens in',
	'home.step1Post': '.',
	'home.step2': 'Start a session — Iris reads your location, light, and weather.',
	'home.step3': 'Shoot the task and upload the photo.',
	'home.step4': 'Get a scored critique against the brief.',

	// ---- session ----
	'session.title': '📷 Session',
	'session.shootingWith': 'Shooting with',
	'session.noCamera': 'No camera selected.',
	'session.addKeyNoteStart': 'Add an API key in',
	'session.addKeyNoteEnd': 'to begin.',
	'session.generateTask': 'Generate a task for right now',
	'session.gathering': 'Reading your location, light, and weather…',
	'session.weatherSummary': '{temp}°C · {cloud}% cloud · {wind} km/h wind',
	'session.tapPlace': 'Tap a place to design the task around it:',
	'session.preparing': 'Preparing your photo…',
	'session.critiquing': 'Critiquing your photo…',
	'session.designingAround': 'Designing a task around {name}…',
	'session.openInMaps': '🗺️ Open {name} in Maps',
	'session.brief': 'Brief',
	'session.onYourCamera': 'On your camera',
	'session.suggestedStart': 'Suggested start',
	'session.successCriteria': 'Success criteria',
	'session.coachingTips': 'Coaching tips',
	'session.captureSubmit': '📸 Capture / submit',
	'session.uploadRoll': '⬆️ Upload from camera roll',
	'session.newTask': '↻ New task',
	'session.outOf100': 'out of 100',
	'session.strengths': 'Strengths',
	'session.tryNext': 'Try next time',
	'session.detectedFromPhoto': 'Detected from your photo',
	'session.lens': 'Lens',
	'session.geoMismatch': "Photo's GPS is {m} m from your session location.",
	'session.viewHistory': 'View history',
	'session.errorNoCamera': 'Select a camera in Gear first.',
	'session.errorNoKey': 'Add an API key in Setup first.',

	// ---- constraint list ----
	'constraint.focalExact': 'Focal length ≈ {n}mm',
	'constraint.focalRange': 'Focal length {min}–{max}mm',
	'constraint.aperture': 'Aperture f/{n} or wider',
	'constraint.iso': 'ISO ≤ {n}',
	'constraint.handhold': 'Handhold at ≈ {s} or faster',
	'constraint.motion': 'Motion: {x}',
	'constraint.composition': 'Composition: {rule}',

	// ---- difficulty + motion enums ----
	'difficulty.beginner': 'Beginner',
	'difficulty.intermediate': 'Intermediate',
	'difficulty.advanced': 'Advanced',
	'motion.freeze': 'freeze motion',
	'motion.pan': 'panning',
	'motion.blur': 'motion blur',

	// ---- setup ----
	'setup.title': '⚙️ Setup',
	'setup.byokNote':
		'Bring your own key: Iris calls your LLM provider directly from the browser. Your API key is stored only on this device (IndexedDB) and is sent only to the provider you choose.',
	'setup.language': 'Language',
	'setup.languageHint':
		'Tasks and critiques are written in this language. Existing sessions keep their original language.',
	'setup.provider': 'LLM provider',
	'setup.noVision': '(no vision)',
	'setup.apiKey': 'API key',
	'setup.apiKeyPlaceholder': 'sk-… / your provider key',
	'setup.testKey': 'Test key',
	'setup.getKey': 'Get a {provider} key ↗',
	'setup.valid': 'Valid',
	'setup.failed': 'Failed',
	'setup.textModel': 'Text model (task design)',
	'setup.visionModel': 'Vision model (evaluation)',
	'setup.visionQuality': 'Vision quality: {q}. Edit the model ids to use newer releases.',
	'setup.skill': 'Your skill level',
	'setup.augmentGear': 'Let the LLM fill specs for gear not in the catalog',
	'setup.save': 'Save settings',
	'setup.saving': 'Saving…',
	'setup.loadErrorSuffix': '— showing defaults.',

	// ---- gear ----
	'gear.title': '🎚️ Gear',
	'gear.cameraBody': 'Camera body',
	'gear.mountWord': 'mount',
	'gear.phoneWord': 'Phone',
	'gear.lensesMount': 'Lenses · {mount} mount',
	'gear.noneYet': '(none yet)',
	'gear.removeLens': 'Remove lens',
	'gear.addLens': 'Add a lens',
	'gear.addLensShort': '＋ Add lens',
	'gear.make': 'Make',
	'gear.model': 'Model',
	'gear.makePlaceholder': 'Canon',
	'gear.modelPlaceholder': 'EF 70-200mm f/2.8L IS',
	'gear.deriveNote':
		'Focal length & aperture are derived from the model name. EF/EF-S lenses mount via an EF-EOS R adapter on this body.',
	'gear.primeLabel': 'Prime lens (uncheck for zoom)',
	'gear.focalMin': 'Focal min (mm)',
	'gear.focalMax': 'Focal max (mm)',
	'gear.maxAperture': 'Max aperture (f/)',
	'gear.stabilized': 'Stabilized (OIS)',
	'gear.fillWithAI': '✨ Fill specs with AI',
	'gear.lookingUp': 'Looking up…',
	'gear.addLensBtn': 'Add lens',
	'gear.aiNote':
		'AI lookup uses your active LLM provider. You can also type the specs yourself and skip it.',
	'gear.selectedRig': 'Selected rig',
	'gear.noLens': 'No lens selected',
	'gear.adapterNote': 'This {mount} lens mounts via an {adapter}.',
	'gear.shootWithRig': 'Shoot with this rig →',
	'gear.sourceYours': 'yours',
	'gear.sourceAi': 'AI-filled',
	'gear.adapter': 'adapter',
	'gear.errorNeedMakeModel': 'Enter a make and model.',
	'gear.errorNeedMakeModelAi': 'Enter a make and model first.',
	'gear.errorNeedKey': 'Add an API key in Setup to use AI lookup.',
	'gear.errorSaveLens': 'Could not save lens: {msg}',
	'gear.errorAiFailed': 'AI lookup failed: {msg}',

	// ---- history ----
	'history.title': '📜 History',
	'history.emptyStart': 'No sessions yet. ',
	'history.startOne': 'Start one',
	'history.emptyEnd': ' to build your history.',
	'history.session': 'Session',
	'history.notEvaluated': 'Not evaluated',

	// ---- weather (WMO code -> text) ----
	'weather.unknown': 'Unknown',
	'weather.clear': 'Clear',
	'weather.mainlyClear': 'Mainly clear',
	'weather.partlyCloudy': 'Partly cloudy',
	'weather.overcast': 'Overcast',
	'weather.fog': 'Fog',
	'weather.rimeFog': 'Rime fog',
	'weather.lightDrizzle': 'Light drizzle',
	'weather.drizzle': 'Drizzle',
	'weather.heavyDrizzle': 'Heavy drizzle',
	'weather.freezingDrizzle': 'Freezing drizzle',
	'weather.lightRain': 'Light rain',
	'weather.rain': 'Rain',
	'weather.heavyRain': 'Heavy rain',
	'weather.freezingRain': 'Freezing rain',
	'weather.lightSnow': 'Light snow',
	'weather.snow': 'Snow',
	'weather.heavySnow': 'Heavy snow',
	'weather.snowGrains': 'Snow grains',
	'weather.lightShowers': 'Light showers',
	'weather.showers': 'Showers',
	'weather.violentShowers': 'Violent showers',
	'weather.snowShowers': 'Snow showers',
	'weather.thunderstorm': 'Thunderstorm',
	'weather.thunderstormHail': 'Thunderstorm + hail',

	// ---- light phases ----
	'light.day': 'Daylight',
	'light.goldenHour': 'Golden hour',
	'light.blueHour': 'Blue hour',
	'light.civilTwilight': 'Civil twilight',
	'light.nauticalTwilight': 'Nautical twilight',
	'light.astronomicalTwilight': 'Astronomical twilight',
	'light.night': 'Night',
	'light.starts': 'starts',
	'light.ends': 'ends',
	'light.label': '{phase} — {verb} in {time}',
	'light.minOnly': '{n} min',
	'light.hourMin': '{h}h {m}m',
	'light.hourOnly': '{h}h'
} as const;

export type MessageKey = keyof typeof en;

const da: Record<MessageKey, string> = {
	// ---- nav ----
	'nav.home': 'Hjem',
	'nav.shoot': 'Skud',
	'nav.gear': 'Udstyr',
	'nav.history': 'Historik',
	'nav.setup': 'Opsætning',

	// ---- common ----
	'common.loading': 'Indlæser…',
	'common.cancel': 'Annullér',
	'common.retry': 'Prøv igen',
	'common.unknownLocation': 'Ukendt lokation',

	// ---- home ----
	'home.hero':
		'Din lokalitetsbevidste fotocoach. Fortæl Iris, hvad du skyder med, så finder den en opgave, der passer til lyset og vejret lige nu — og giver din billede kritik bagefter.',
	'home.noKeyNoteStart': 'Tilføj først en API-nøgle til en LLM-udbyder (f.eks. OpenRouter) under',
	'home.noKeyNoteEnd':
		'. Iris ringer til udbyderen direkte fra din enhed — din nøgle bliver på denne enhed.',
	'home.ready': 'Klar til at skyde',
	'home.noCamera': 'Intet kamera valgt',
	'home.startSession': 'Start session →',
	'home.changeGear': 'Skift udstyr',
	'home.howItWorks': 'Sådan fungerer det',
	'home.step1Pre': 'Vælg dit kamera og objektiv under',
	'home.step1Post': '.',
	'home.step2': 'Start en session — Iris aflæser din lokation, lyset og vejret.',
	'home.step3': 'Skyd opgaven og upload billedet.',
	'home.step4': 'Få en pointgivende kritik ud fra opgaven.',

	// ---- session ----
	'session.title': '📷 Session',
	'session.shootingWith': 'Skyder med',
	'session.noCamera': 'Intet kamera valgt.',
	'session.addKeyNoteStart': 'Tilføj en API-nøgle under',
	'session.addKeyNoteEnd': 'for at begynde.',
	'session.generateTask': 'Generér en opgave til lige nu',
	'session.gathering': 'Aflæser din lokation, lyset og vejret…',
	'session.weatherSummary': '{temp}°C · {cloud}% sky · {wind} km/t vind',
	'session.tapPlace': 'Tryk på et sted for at bygge opgaven omkring det:',
	'session.preparing': 'Klargør dit billede…',
	'session.critiquing': 'Bedømmer dit billede…',
	'session.designingAround': 'Designer en opgave omkring {name}…',
	'session.openInMaps': '🗺️ Åbn {name} i Kort',
	'session.brief': 'Opgave',
	'session.onYourCamera': 'På dit kamera',
	'session.suggestedStart': 'Forslag til start',
	'session.successCriteria': 'Succeskriterier',
	'session.coachingTips': 'Coachingtips',
	'session.captureSubmit': '📸 Tag / indsend billede',
	'session.uploadRoll': '⬆️ Upload fra kamerarulle',
	'session.newTask': '↻ Ny opgave',
	'session.outOf100': 'ud af 100',
	'session.strengths': 'Styrker',
	'session.tryNext': 'Næste gang',
	'session.detectedFromPhoto': 'Registreret ud fra dit billede',
	'session.lens': 'Objektiv',
	'session.geoMismatch': 'Billedets GPS er {m} m fra din sessionslokation.',
	'session.viewHistory': 'Vis historik',
	'session.errorNoCamera': 'Vælg først et kamera under Udstyr.',
	'session.errorNoKey': 'Tilføj en API-nøgle under Opsætning først.',

	// ---- constraint list ----
	'constraint.focalExact': 'Brændvidde ≈ {n}mm',
	'constraint.focalRange': 'Brændvidde {min}–{max}mm',
	'constraint.aperture': 'Blænde f/{n} eller mere åben',
	'constraint.iso': 'ISO ≤ {n}',
	'constraint.handhold': 'Håndholdt ved ≈ {s} eller hurtigere',
	'constraint.motion': 'Bevægelse: {x}',
	'constraint.composition': 'Komposition: {rule}',

	// ---- difficulty + motion enums ----
	'difficulty.beginner': 'Begynder',
	'difficulty.intermediate': 'Øvet',
	'difficulty.advanced': 'Avanceret',
	'motion.freeze': 'frys bevægelsen',
	'motion.pan': 'medpanorering',
	'motion.blur': 'bevægelsesslør',

	// ---- setup ----
	'setup.title': '⚙️ Opsætning',
	'setup.byokNote':
		'Medbring din egen nøgle: Iris ringer til din LLM-udbyder direkte fra browseren. Din API-nøgle gemmes kun på denne enhed (IndexedDB) og sendes kun til den udbyder, du vælger.',
	'setup.language': 'Sprog',
	'setup.languageHint':
		'Opgaver og kritik skrives på dette sprog. Eksisterende sessioner beholder deres oprindelige sprog.',
	'setup.provider': 'LLM-udbyder',
	'setup.noVision': '(ingen billedgenkendelse)',
	'setup.apiKey': 'API-nøgle',
	'setup.apiKeyPlaceholder': 'sk-… / din udbydernøgle',
	'setup.testKey': 'Test nøgle',
	'setup.getKey': 'Hent en {provider}-nøgle ↗',
	'setup.valid': 'Gyldig',
	'setup.failed': 'Mislykkedes',
	'setup.textModel': 'Tekstmodel (opgavedesign)',
	'setup.visionModel': 'Vision-model (bedømmelse)',
	'setup.visionQuality': 'Vision-kvalitet: {q}. Rediger model-id’erne for at bruge nyere udgaver.',
	'setup.skill': 'Dit niveau',
	'setup.augmentGear': 'Lad LLM’en udfylde specifikationer for udstyr, der ikke er i kataloget',
	'setup.save': 'Gem indstillinger',
	'setup.saving': 'Gemmer…',
	'setup.loadErrorSuffix': '— viser standardværdier.',

	// ---- gear ----
	'gear.title': '🎚️ Udstyr',
	'gear.cameraBody': 'Kamerahus',
	'gear.mountWord': 'fatning',
	'gear.phoneWord': 'Telefon',
	'gear.lensesMount': 'Objektiver · {mount}-fatning',
	'gear.noneYet': '(ingen endnu)',
	'gear.removeLens': 'Fjern objektiv',
	'gear.addLens': 'Tilføj et objektiv',
	'gear.addLensShort': '＋ Tilføj objektiv',
	'gear.make': 'Mærke',
	'gear.model': 'Model',
	'gear.makePlaceholder': 'Canon',
	'gear.modelPlaceholder': 'EF 70-200mm f/2.8L IS',
	'gear.deriveNote':
		'Brændvidde og blænde udledes af modelnavnet. EF/EF-S-objektiver monteres via en EF-EOS R-adapter på dette hus.',
	'gear.primeLabel': 'Fast objektiv (fravælg for zoom)',
	'gear.focalMin': 'Brændvidde min (mm)',
	'gear.focalMax': 'Brændvidde max (mm)',
	'gear.maxAperture': 'Maks. blænde (f/)',
	'gear.stabilized': 'Stabiliseret (OIS)',
	'gear.fillWithAI': '✨ Udfyld specifikationer med AI',
	'gear.lookingUp': 'Slår op…',
	'gear.addLensBtn': 'Tilføj objektiv',
	'gear.aiNote':
		'AI-opslag bruger din aktive LLM-udbyder. Du kan også indtaste specifikationerne selv og springe det over.',
	'gear.selectedRig': 'Valgt udstyr',
	'gear.noLens': 'Intet objektiv valgt',
	'gear.adapterNote': 'Dette {mount}-objektiv monteres via en {adapter}.',
	'gear.shootWithRig': 'Skyd med dette udstyr →',
	'gear.sourceYours': 'dit',
	'gear.sourceAi': 'AI-udfyldt',
	'gear.adapter': 'adapter',
	'gear.errorNeedMakeModel': 'Indtast mærke og model.',
	'gear.errorNeedMakeModelAi': 'Indtast først mærke og model.',
	'gear.errorNeedKey': 'Tilføj en API-nøgle under Opsætning for at bruge AI-opslag.',
	'gear.errorSaveLens': 'Kunne ikke gemme objektiv: {msg}',
	'gear.errorAiFailed': 'AI-opslag mislykkedes: {msg}',

	// ---- history ----
	'history.title': '📜 Historik',
	'history.emptyStart': 'Ingen sessioner endnu. ',
	'history.startOne': 'Start en',
	'history.emptyEnd': ' for at opbygge din historik.',
	'history.session': 'Session',
	'history.notEvaluated': 'Ikke bedømt',

	// ---- weather ----
	'weather.unknown': 'Ukendt',
	'weather.clear': 'Klar',
	'weather.mainlyClear': 'Overvejende klart',
	'weather.partlyCloudy': 'Delvist skyet',
	'weather.overcast': 'Overskyet',
	'weather.fog': 'Tåge',
	'weather.rimeFog': 'Rimtåge',
	'weather.lightDrizzle': 'Let støvregn',
	'weather.drizzle': 'Støvregn',
	'weather.heavyDrizzle': 'Kraftig støvregn',
	'weather.freezingDrizzle': 'Underkølet støvregn',
	'weather.lightRain': 'Let regn',
	'weather.rain': 'Regn',
	'weather.heavyRain': 'Kraftig regn',
	'weather.freezingRain': 'Underkølet regn',
	'weather.lightSnow': 'Let sne',
	'weather.snow': 'Sne',
	'weather.heavySnow': 'Kraftig sne',
	'weather.snowGrains': 'Snekorn',
	'weather.lightShowers': 'Let byger',
	'weather.showers': 'Byger',
	'weather.violentShowers': 'Kraftige byger',
	'weather.snowShowers': 'Snebyger',
	'weather.thunderstorm': 'Tordenvejr',
	'weather.thunderstormHail': 'Tordenvejr med hagl',

	// ---- light ----
	'light.day': 'Dagslys',
	'light.goldenHour': 'Gyldne time',
	'light.blueHour': 'Blå time',
	'light.civilTwilight': 'Civilt tusmørke',
	'light.nauticalTwilight': 'Nautisk tusmørke',
	'light.astronomicalTwilight': 'Astronomisk tusmørke',
	'light.night': 'Nat',
	'light.starts': 'starter',
	'light.ends': 'slutter',
	'light.label': '{phase} — {verb} om {time}',
	'light.minOnly': '{n} min',
	'light.hourMin': '{h}t {m}m',
	'light.hourOnly': '{h}t'
};

export const dictionaries: Record<UiKey, Record<MessageKey, string>> = { en, da };

export type TranslateParams = Record<string, string | number>;

/** Replace {name} placeholders with params values. */
function interpolate(template: string, params?: TranslateParams): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (m, key: string) =>
		key in params ? String(params[key]) : m
	);
}

/** Resolve a message for a UI dictionary, falling back to en then the key itself. */
export function translate(ui: UiKey, key: MessageKey, params?: TranslateParams): string {
	const dict = dictionaries[ui] ?? dictionaries.en;
	const template = dict[key] ?? dictionaries.en[key] ?? key;
	return interpolate(template, params);
}

// ---- weather (WMO code -> localized text) ----
const WEATHER_CODES: Record<number, MessageKey> = {
	0: 'weather.clear',
	1: 'weather.mainlyClear',
	2: 'weather.partlyCloudy',
	3: 'weather.overcast',
	45: 'weather.fog',
	48: 'weather.rimeFog',
	51: 'weather.lightDrizzle',
	53: 'weather.drizzle',
	55: 'weather.heavyDrizzle',
	56: 'weather.freezingDrizzle',
	57: 'weather.freezingDrizzle',
	61: 'weather.lightRain',
	63: 'weather.rain',
	65: 'weather.heavyRain',
	66: 'weather.freezingRain',
	67: 'weather.freezingRain',
	71: 'weather.lightSnow',
	73: 'weather.snow',
	75: 'weather.heavySnow',
	77: 'weather.snowGrains',
	80: 'weather.lightShowers',
	81: 'weather.showers',
	82: 'weather.violentShowers',
	85: 'weather.snowShowers',
	86: 'weather.snowShowers',
	95: 'weather.thunderstorm',
	96: 'weather.thunderstormHail',
	99: 'weather.thunderstormHail'
};

/** Localized text for an Open-Meteo WMO weather code. */
export function weatherText(code: number | undefined | null, ui: UiKey = 'en'): string {
	if (code == null) return translate(ui, 'weather.unknown');
	const key = WEATHER_CODES[code];
	return translate(ui, key ?? 'weather.unknown');
}

// ---- light phases ----
const LIGHT_PHASE_KEY: Record<LightPhase, MessageKey> = {
	day: 'light.day',
	'golden-hour': 'light.goldenHour',
	'blue-hour': 'light.blueHour',
	'civil-twilight': 'light.civilTwilight',
	'nautical-twilight': 'light.nauticalTwilight',
	'astronomical-twilight': 'light.astronomicalTwilight',
	night: 'light.night'
};

/** Localized label for a light phase, e.g. "Golden hour". */
export function lightPhaseLabel(phase: LightPhase, ui: UiKey = 'en'): string {
	return translate(ui, LIGHT_PHASE_KEY[phase]);
}

function formatMinutes(min: number, ui: UiKey): string {
	if (min < 60) return translate(ui, 'light.minOnly', { n: min });
	const h = Math.floor(min / 60);
	const m = min % 60;
	return m
		? translate(ui, 'light.hourMin', { h, m })
		: translate(ui, 'light.hourOnly', { h });
}

/**
 * Localized composite label: "<phase> — starts/ends in <time>", or just the
 * phase name when there is no upcoming change.
 */
export function lightLabel(
	phase: LightPhase,
	minutesUntilChange: number,
	verb: 'starts' | 'ends',
	ui: UiKey = 'en'
): string {
	const phaseName = lightPhaseLabel(phase, ui);
	if (minutesUntilChange <= 0) return phaseName;
	return translate(ui, 'light.label', {
		phase: phaseName,
		verb: translate(ui, verb === 'starts' ? 'light.starts' : 'light.ends'),
		time: formatMinutes(minutesUntilChange, ui)
	});
}

/** Localized label for a task difficulty level. */
export function difficultyLabel(d: Difficulty, ui: UiKey = 'en'): string {
	return translate(ui, `difficulty.${d}` as MessageKey);
}

/** Localized label for a motion-type constraint. */
export function motionLabel(m: MotionType, ui: UiKey = 'en'): string {
	return translate(ui, `motion.${m}` as MessageKey);
}
