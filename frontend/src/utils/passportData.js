// Deterministic mock passport data per asset (IMEI based) so values stay stable across reloads.
const BREEDS = {
  Camel: [
    { ar: 'مجاهيم', en: 'Majaheem' },
    { ar: 'وضح', en: 'Wadah' },
    { ar: 'صفر', en: 'Sufr' },
    { ar: 'شعل', en: 'Shu’l' },
  ],
  Horse: [
    { ar: 'عربي أصيل', en: 'Arabian' },
    { ar: 'عربي مصري', en: 'Egyptian Arabian' },
    { ar: 'شقراء', en: 'Chestnut Arabian' },
  ],
  Falcon: [
    { ar: 'حر', en: 'Saker' },
    { ar: 'شاهين', en: 'Peregrine' },
    { ar: 'وكري', en: 'Gyrfalcon' },
  ],
};

const GENDERS = [
  { ar: 'ذكر', en: 'Male' },
  { ar: 'أنثى', en: 'Female' },
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getPassport(animal) {
  if (!animal) return null;
  const seed = hashStr(animal.device_imei || animal.name || 'x');
  const species = animal.species || 'Camel';
  const breeds = BREEDS[species] || BREEDS.Camel;
  const breed = breeds[seed % breeds.length];
  const gender = GENDERS[(seed >> 3) % 2];
  const age = 3 + (seed % 12); // years
  // 15-digit microchip (ISO 11784/11785 style)
  const chipDigits = String(seed).padStart(9, '0').slice(0, 9);
  const microchip = `682 ${chipDigits.slice(0, 3)} ${chipDigits.slice(3, 6)} ${chipDigits.slice(6, 9)}`;
  const ownership = `RT-${String((seed >> 5) % 99999).padStart(5, '0')}`;
  const registered = new Date(2020 + (seed % 5), seed % 12, 1 + (seed % 27));
  return {
    microchip,
    breed,
    gender,
    age,
    ownership,
    registered,
    verified: true,
  };
}
